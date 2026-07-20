import Database from "better-sqlite3"
import { join } from "node:path"
import { mkdirSync, accessSync, constants } from "node:fs"

const DATA_DIR = process.env.ROTATION_DATA_DIR || "./data"
const DB_PATH = join(DATA_DIR, "rotation.db")

export function initDatabase(path?: string, maxMigrationVersion = Number.POSITIVE_INFINITY): Database.Database {
    const dbPath = path ?? DB_PATH
    if (!path) {
        mkdirSync(DATA_DIR, { recursive: true })
        try {
            accessSync(DATA_DIR, constants.W_OK)
        } catch {
            throw new Error(
                `Rotation data directory is not writable: ${DATA_DIR}\n` +
                `Ensure the container user has write permissions on this path.`
            )
        }
    }
    const db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
    db.pragma("foreign_keys = ON")
    migrate(db, maxMigrationVersion)
    return db
}

interface Migration {
    version: number
    name: string
    disableForeignKeys?: boolean
    run: (db: Database.Database) => void
}

const migrations: Migration[] = [
    {
        version: 1,
        name: "initial-schema",
        run(db) {
            db.exec(`
        CREATE TABLE IF NOT EXISTS bindings (
            album_id TEXT PRIMARY KEY,
            relative_path TEXT NOT NULL,
            state TEXT CHECK(state IN ('unbound', 'proposed', 'confirmed', 'missing')) NOT NULL DEFAULT 'unbound',
            match_source TEXT CHECK(match_source IN ('scan-exact', 'manual')),
            proposed_at TEXT,
            confirmed_at TEXT,
            library_album_id TEXT
        );

        CREATE TABLE IF NOT EXISTS albums (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            year TEXT,
            category TEXT,
            cover_url TEXT,
            cover_override TEXT,
            role_history TEXT NOT NULL DEFAULT '[]',
            listen_count INTEGER NOT NULL DEFAULT 0,
            last_listened TEXT,
            story TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS export_operations (
            id TEXT PRIMARY KEY,
            rotation_plan_id TEXT,
            created_at TEXT NOT NULL,
            status TEXT CHECK(status IN ('created', 'previewed', 'staged', 'applied', 'archived', 'rolled_back')) NOT NULL DEFAULT 'created',
            album_ids TEXT NOT NULL,
            staging_path TEXT,
            archive_path TEXT,
            total_size_bytes INTEGER,
            file_count INTEGER
        );

        CREATE TABLE IF NOT EXISTS scan_runs (
            id TEXT PRIMARY KEY,
            started_at TEXT NOT NULL,
            finished_at TEXT NOT NULL,
            directories_scanned INTEGER NOT NULL DEFAULT 0,
            directories_skipped INTEGER NOT NULL DEFAULT 0,
            album_folders_found INTEGER NOT NULL DEFAULT 0,
            status TEXT CHECK(status IN ('running', 'completed', 'failed')) NOT NULL DEFAULT 'running',
            error_message TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_bindings_album_id ON bindings(album_id);
        CREATE INDEX IF NOT EXISTS idx_bindings_library_album_id ON bindings(library_album_id);

        CREATE TABLE IF NOT EXISTS export_locks (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            export_id TEXT,
            acquired_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        );
            `)
        },
    },
    {
        version: 2,
        name: "album-integrity-and-binding-foreign-key",
        disableForeignKeys: true,
        run(db) {
            db.exec(`
                        CREATE TABLE albums_v2 (
                            id TEXT PRIMARY KEY,
                            title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 500),
                            artist TEXT NOT NULL CHECK(length(trim(artist)) BETWEEN 1 AND 500),
                            year TEXT CHECK(year IS NULL OR length(year) <= 20),
                            category TEXT CHECK(category IS NULL OR category IN ('new', 'growing', 'comfort-food', 'classic', 'admire', 'archive')),
                            cover_url TEXT,
                            cover_override TEXT CHECK(cover_override IS NULL OR json_valid(cover_override)),
                            role_history TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(role_history)),
                            listen_count INTEGER NOT NULL DEFAULT 0 CHECK(listen_count >= 0),
                            last_listened TEXT,
                            story TEXT CHECK(story IS NULL OR json_valid(story)),
                            created_at TEXT NOT NULL,
                            updated_at TEXT NOT NULL
                        );

                        INSERT INTO albums_v2 (
                            id, title, artist, year, category, cover_url, cover_override,
                            role_history, listen_count, last_listened, story, created_at, updated_at
                        )
                        SELECT
                            id,
                            substr(CASE WHEN length(trim(title)) > 0 THEN trim(title) ELSE 'Untitled' END, 1, 500),
                            substr(CASE WHEN length(trim(artist)) > 0 THEN trim(artist) ELSE 'Unknown Artist' END, 1, 500),
                            substr(COALESCE(year, ''), 1, 20),
                            CASE WHEN category IN ('new', 'growing', 'comfort-food', 'classic', 'admire', 'archive') THEN category ELSE NULL END,
                            cover_url,
                            CASE WHEN cover_override IS NULL OR json_valid(cover_override) THEN cover_override ELSE NULL END,
                            CASE WHEN json_valid(role_history) THEN role_history ELSE '[]' END,
                            CASE WHEN typeof(listen_count) = 'integer' AND listen_count >= 0 THEN listen_count ELSE 0 END,
                            last_listened,
                            CASE WHEN story IS NULL OR json_valid(story) THEN story ELSE NULL END,
                            created_at,
                            updated_at
                        FROM albums;

                        CREATE TABLE bindings_v2 (
                            album_id TEXT PRIMARY KEY,
                            relative_path TEXT NOT NULL,
                            state TEXT CHECK(state IN ('unbound', 'proposed', 'confirmed', 'missing')) NOT NULL DEFAULT 'unbound',
                            match_source TEXT CHECK(match_source IN ('scan-exact', 'manual')),
                            proposed_at TEXT,
                            confirmed_at TEXT,
                            library_album_id TEXT REFERENCES albums_v2(id) ON DELETE SET NULL
                        );

                        INSERT INTO bindings_v2 (
                            album_id, relative_path, state, match_source, proposed_at, confirmed_at, library_album_id
                        )
                        SELECT
                            album_id, relative_path, state, match_source, proposed_at, confirmed_at,
                            CASE WHEN EXISTS (SELECT 1 FROM albums_v2 a WHERE a.id = bindings.library_album_id)
                                THEN library_album_id ELSE NULL END
                        FROM bindings;

                        DROP TABLE bindings;
                        DROP TABLE albums;
                        ALTER TABLE albums_v2 RENAME TO albums;
                        ALTER TABLE bindings_v2 RENAME TO bindings;
                        CREATE INDEX idx_bindings_album_id ON bindings(album_id);
                        CREATE INDEX idx_bindings_library_album_id ON bindings(library_album_id);
            `)
        },
    },
    {
        version: 3,
        name: "binding-candidate-review",
        run(db) {
            db.exec(`
                CREATE TABLE binding_candidates (
                    binding_album_id TEXT NOT NULL REFERENCES bindings(album_id) ON DELETE CASCADE,
                    library_album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
                    scan_id TEXT NOT NULL REFERENCES scan_runs(id) ON DELETE CASCADE,
                    rank INTEGER NOT NULL CHECK(rank BETWEEN 1 AND 3),
                    score REAL NOT NULL CHECK(score BETWEEN 0 AND 1),
                    confidence TEXT NOT NULL CHECK(confidence IN ('strong', 'possible', 'ambiguous')),
                    reasons_json TEXT NOT NULL CHECK(json_valid(reasons_json)),
                    created_at TEXT NOT NULL,
                    PRIMARY KEY (binding_album_id, library_album_id)
                );
                CREATE INDEX idx_binding_candidates_scan ON binding_candidates(scan_id);
            `)
        },
    },
    {
        version: 4,
        name: "canonical-rotation-and-listening-state",
        run(db) {
            db.exec(`
                CREATE TABLE rotation_plans (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    target_size INTEGER NOT NULL CHECK(target_size > 0),
                    role_quotas_json TEXT NOT NULL CHECK(json_valid(role_quotas_json)),
                    status TEXT NOT NULL CHECK(status IN ('draft', 'active')),
                    focus_album_id TEXT REFERENCES albums(id) ON DELETE SET NULL,
                    created_at TEXT NOT NULL,
                    accepted_at TEXT
                );
                CREATE UNIQUE INDEX idx_one_active_rotation ON rotation_plans(status) WHERE status = 'active';
                CREATE TABLE rotation_plan_items (
                    rotation_plan_id TEXT NOT NULL REFERENCES rotation_plans(id) ON DELETE CASCADE,
                    album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
                    position INTEGER NOT NULL CHECK(position >= 0),
                    role TEXT NOT NULL CHECK(role IN ('new','growing','comfort-food','classic','admire','archive')),
                    reason TEXT NOT NULL CHECK(reason IN ('quota','fill')),
                    PRIMARY KEY (rotation_plan_id, album_id),
                    UNIQUE (rotation_plan_id, position)
                );
                CREATE TABLE listen_events (
                    id TEXT PRIMARY KEY,
                    album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
                    listened_at TEXT NOT NULL
                );
                CREATE INDEX idx_listen_events_album_time ON listen_events(album_id, listened_at DESC);
            `)
        },
    },
    {
        version: 5,
        name: "rotation-role-eligibility",
        run(db) {
            db.exec(`
                DELETE FROM rotation_plan_items
                WHERE role IN ('classic', 'admire', 'archive');
                UPDATE rotation_plans SET focus_album_id = NULL
                WHERE focus_album_id IS NOT NULL AND NOT EXISTS (
                    SELECT 1 FROM rotation_plan_items i
                    WHERE i.rotation_plan_id = rotation_plans.id
                      AND i.album_id = rotation_plans.focus_album_id
                );
                CREATE TRIGGER remove_ineligible_album_from_rotations
                AFTER UPDATE OF category ON albums
                WHEN NEW.category IN ('classic', 'admire', 'archive')
                BEGIN
                    DELETE FROM rotation_plan_items WHERE album_id = NEW.id;
                    UPDATE rotation_plans SET focus_album_id = NULL WHERE focus_album_id = NEW.id;
                END;
            `)
        },
    },
    {
        version: 6,
        name: "restore-classic-rotation-eligibility",
        run(db) {
            db.exec(`
                DROP TRIGGER IF EXISTS remove_ineligible_album_from_rotations;
                CREATE TRIGGER remove_ineligible_album_from_rotations
                AFTER UPDATE OF category ON albums
                WHEN NEW.category IN ('admire', 'archive')
                BEGIN
                    DELETE FROM rotation_plan_items WHERE album_id = NEW.id;
                    UPDATE rotation_plans SET focus_album_id = NULL WHERE focus_album_id = NEW.id;
                END;
            `)
        },
    },
    {
        version: 7,
        name: "server-owned-rotation-settings",
        run(db) {
            db.exec(`
                CREATE TABLE rotation_settings (
                    singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
                    target_size INTEGER NOT NULL CHECK(target_size > 0 AND target_size <= 100),
                    role_quotas_json TEXT NOT NULL CHECK(json_valid(role_quotas_json)),
                    updated_at TEXT NOT NULL
                );
                INSERT INTO rotation_settings VALUES (
                    1, 25,
                    '[{"role":"new","targetCount":10},{"role":"comfort-food","targetCount":5},{"role":"classic","targetCount":5},{"role":"growing","targetCount":5}]',
                    CURRENT_TIMESTAMP
                );
            `)
        },
    },
    {
        version: 8,
        name: "rotation-lifecycle-history",
        disableForeignKeys: true,
        run(db) {
            db.exec(`
                DROP TRIGGER IF EXISTS remove_ineligible_album_from_rotations;
                DROP INDEX IF EXISTS idx_one_active_rotation;

                CREATE TABLE rotation_plans_v8 (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    target_size INTEGER NOT NULL CHECK(target_size > 0),
                    role_quotas_json TEXT NOT NULL CHECK(json_valid(role_quotas_json)),
                    status TEXT NOT NULL CHECK(status IN ('draft', 'active', 'archived')),
                    focus_album_id TEXT REFERENCES albums(id) ON DELETE SET NULL,
                    created_at TEXT NOT NULL,
                    accepted_at TEXT,
                    archived_at TEXT
                );
                INSERT INTO rotation_plans_v8
                    (id,name,target_size,role_quotas_json,status,focus_album_id,created_at,accepted_at,archived_at)
                SELECT id,name,target_size,role_quotas_json,status,focus_album_id,created_at,accepted_at,NULL
                FROM rotation_plans;

                CREATE TABLE rotation_plan_items_v8 (
                    rotation_plan_id TEXT NOT NULL REFERENCES rotation_plans_v8(id) ON DELETE CASCADE,
                    album_id TEXT NOT NULL,
                    position INTEGER NOT NULL CHECK(position >= 0),
                    role TEXT NOT NULL CHECK(role IN ('new','growing','comfort-food','classic','admire','archive')),
                    reason TEXT NOT NULL CHECK(reason IN ('quota','fill')),
                    album_title_snapshot TEXT NOT NULL,
                    album_artist_snapshot TEXT NOT NULL,
                    PRIMARY KEY (rotation_plan_id, album_id),
                    UNIQUE (rotation_plan_id, position)
                );
                INSERT INTO rotation_plan_items_v8
                    (rotation_plan_id,album_id,position,role,reason,album_title_snapshot,album_artist_snapshot)
                SELECT i.rotation_plan_id,i.album_id,i.position,i.role,i.reason,
                       COALESCE(a.title,'Deleted Album'),COALESCE(a.artist,'Unknown Artist')
                FROM rotation_plan_items i LEFT JOIN albums a ON a.id=i.album_id;

                DROP TABLE rotation_plan_items;
                DROP TABLE rotation_plans;
                ALTER TABLE rotation_plans_v8 RENAME TO rotation_plans;
                ALTER TABLE rotation_plan_items_v8 RENAME TO rotation_plan_items;
                CREATE UNIQUE INDEX idx_one_active_rotation ON rotation_plans(status) WHERE status='active';
                CREATE INDEX idx_rotation_history ON rotation_plans(status, accepted_at DESC, created_at DESC);

                CREATE TRIGGER remove_ineligible_album_from_rotations
                AFTER UPDATE OF category ON albums
                WHEN NEW.category IN ('admire', 'archive')
                BEGIN
                    DELETE FROM rotation_plan_items
                    WHERE album_id=NEW.id AND rotation_plan_id IN
                        (SELECT id FROM rotation_plans WHERE status IN ('draft','active'));
                    UPDATE rotation_plans SET focus_album_id=NULL WHERE focus_album_id=NEW.id AND status='active';
                END;
            `)
        },
    },
    {
        version: 9,
        name: "domain-audit-trail",
        run(db) {
            db.exec(`
                CREATE TABLE domain_audit_events (
                    id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL CHECK(event_type IN ('album-role-changed')),
                    entity_id TEXT NOT NULL,
                    before_json TEXT NOT NULL CHECK(json_valid(before_json)),
                    after_json TEXT NOT NULL CHECK(json_valid(after_json)),
                    created_at TEXT NOT NULL,
                    undone_at TEXT
                );
                CREATE INDEX idx_audit_latest ON domain_audit_events(undone_at, created_at DESC);
            `)
        },
    },
    {
        version: 10,
        name: "expanded-domain-audit-trail",
        run(db) {
            db.exec(`
                CREATE TABLE domain_audit_events_v10 (
                    id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL CHECK(event_type IN ('album-role-changed','binding-reassigned','draft-item-removed','draft-item-replaced','rotation-accepted','album-role-change-undone')),
                    entity_id TEXT NOT NULL,
                    before_json TEXT NOT NULL CHECK(json_valid(before_json)),
                    after_json TEXT NOT NULL CHECK(json_valid(after_json)),
                    created_at TEXT NOT NULL,
                    undone_at TEXT
                );
                INSERT INTO domain_audit_events_v10 SELECT * FROM domain_audit_events;
                DROP TABLE domain_audit_events;
                ALTER TABLE domain_audit_events_v10 RENAME TO domain_audit_events;
                CREATE INDEX idx_audit_latest ON domain_audit_events(undone_at, created_at DESC);
            `)
        },
    },
    {
        version: 11,
        name: "bounded-list-query-indexes",
        run(db) {
            db.exec(`
                CREATE INDEX idx_albums_created_id ON albums(created_at DESC, id DESC);
                CREATE INDEX idx_listen_events_time ON listen_events(listened_at DESC, id DESC);
                CREATE INDEX idx_exports_rotation_status_created ON export_operations(rotation_plan_id, status, created_at DESC);
            `)
        },
    },
    {
        version: 12,
        name: "reflection-inbox",
        run(db) {
            db.exec(`
                CREATE TABLE reflection_inbox_items (
                    id TEXT PRIMARY KEY,
                    album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
                    rule_code TEXT NOT NULL,
                    evidence_key TEXT NOT NULL,
                    state TEXT NOT NULL CHECK(state IN ('open','snoozed','resolved','dismissed')),
                    evidence_json TEXT NOT NULL CHECK(json_valid(evidence_json)),
                    created_at TEXT NOT NULL,
                    due_at TEXT NOT NULL,
                    snoozed_until TEXT,
                    resolved_at TEXT,
                    resolution TEXT,
                    updated_at TEXT NOT NULL,
                    UNIQUE(album_id, rule_code, evidence_key)
                );
                CREATE INDEX idx_reflection_inbox_state_due
                    ON reflection_inbox_items(state, due_at, snoozed_until);
                CREATE INDEX idx_reflection_inbox_album
                    ON reflection_inbox_items(album_id, updated_at DESC);

                CREATE TABLE domain_audit_events_v12 (
                    id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL CHECK(event_type IN ('album-role-changed','binding-reassigned','draft-item-removed','draft-item-replaced','rotation-accepted','album-role-change-undone','reflection-resolved')),
                    entity_id TEXT NOT NULL,
                    before_json TEXT NOT NULL CHECK(json_valid(before_json)),
                    after_json TEXT NOT NULL CHECK(json_valid(after_json)),
                    created_at TEXT NOT NULL,
                    undone_at TEXT
                );
                INSERT INTO domain_audit_events_v12 SELECT * FROM domain_audit_events;
                DROP TABLE domain_audit_events;
                ALTER TABLE domain_audit_events_v12 RENAME TO domain_audit_events;
                CREATE INDEX idx_audit_latest ON domain_audit_events(undone_at, created_at DESC);
            `)
        },
    },
    {
        version: 13,
        name: "listening-journal",
        run(db) {
            db.exec(`
                CREATE TABLE listening_journal_entries (
                    listen_event_id TEXT PRIMARY KEY REFERENCES listen_events(id) ON DELETE CASCADE,
                    note TEXT NOT NULL CHECK(length(note) <= 2000),
                    mood_tags_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(mood_tags_json)),
                    context_tags_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(context_tags_json)),
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE domain_audit_events_v13 (
                    id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL CHECK(event_type IN ('album-role-changed','binding-reassigned','draft-item-removed','draft-item-replaced','rotation-accepted','album-role-change-undone','reflection-resolved','journal-created','journal-updated','journal-deleted')),
                    entity_id TEXT NOT NULL,
                    before_json TEXT NOT NULL CHECK(json_valid(before_json)),
                    after_json TEXT NOT NULL CHECK(json_valid(after_json)),
                    created_at TEXT NOT NULL,
                    undone_at TEXT
                );
                INSERT INTO domain_audit_events_v13 SELECT * FROM domain_audit_events;
                DROP TABLE domain_audit_events;
                ALTER TABLE domain_audit_events_v13 RENAME TO domain_audit_events;
                CREATE INDEX idx_audit_latest ON domain_audit_events(undone_at, created_at DESC);
            `)
        },
    },
    {
        version: 14,
        name: "cover-resolution-state",
        run(db) {
            db.exec(`
                CREATE TABLE cover_resolution_state (
                    album_id TEXT PRIMARY KEY REFERENCES albums(id) ON DELETE CASCADE,
                    source_type TEXT CHECK(source_type IS NULL OR source_type IN ('folder','embedded','remote','upload','alternative')),
                    status TEXT NOT NULL CHECK(status IN ('cached','not-found','temporarily-unavailable','invalid-image')),
                    last_attempt_at TEXT NOT NULL,
                    resolved_at TEXT,
                    failure_code TEXT CHECK(failure_code IS NULL OR failure_code IN ('local-artwork-not-found','remote-not-found','remote-temporarily-unavailable','invalid-image')),
                    source_fingerprint TEXT,
                    size_bytes INTEGER CHECK(size_bytes IS NULL OR size_bytes BETWEEN 0 AND 5242880),
                    mime_type TEXT CHECK(mime_type IS NULL OR mime_type IN ('image/jpeg','image/png','image/webp','image/gif')),
                    width INTEGER CHECK(width IS NULL OR width > 0),
                    height INTEGER CHECK(height IS NULL OR height > 0),
                    candidate_urls_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(candidate_urls_json))
                );
                CREATE INDEX idx_cover_resolution_status_attempt
                    ON cover_resolution_state(status, last_attempt_at DESC);
            `)
        },
    },
    {
        version: 15,
        name: "album-external-sources",
        run(db) {
            db.exec(`
                CREATE TABLE album_sources (
                    album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
                    provider TEXT NOT NULL CHECK(provider IN ('musicbrainz','wikipedia','wikidata')),
                    external_id TEXT,
                    url TEXT,
                    locale TEXT CHECK(locale IS NULL OR locale IN ('de','en')),
                    resolution_status TEXT NOT NULL CHECK(resolution_status IN ('resolved','missing','ambiguous','failed')),
                    resolved_at TEXT NOT NULL,
                    confirmed_by_user INTEGER NOT NULL DEFAULT 0 CHECK(confirmed_by_user IN (0,1)),
                    CHECK(url IS NULL OR (length(url) BETWEEN 1 AND 4096 AND substr(url,1,8)='https://')),
                    CHECK(external_id IS NOT NULL OR url IS NOT NULL),
                    PRIMARY KEY (album_id, provider, external_id)
                );
                CREATE INDEX idx_album_sources_album ON album_sources(album_id, provider);
            `)
        },
    },
    {
        version: 16,
        name: "playback-manifest-cache",
        run(db) {
            db.exec(`
                CREATE TABLE playback_manifest_cache (
                    album_id TEXT PRIMARY KEY REFERENCES albums(id) ON DELETE CASCADE,
                    manifest_json TEXT NOT NULL,
                    ordering_diagnostic TEXT NOT NULL CHECK(ordering_diagnostic IN ('ok','missing-track-numbers','missing-disc-numbers','duplicate-positions','filename-fallback-used')),
                    filename_fallback_used INTEGER NOT NULL DEFAULT 0 CHECK(filename_fallback_used IN (0,1)),
                    cached_at TEXT NOT NULL,
                    invalidated_at TEXT
                );
            `)
        },
    },
]

function migrate(db: Database.Database, maxMigrationVersion: number): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL
        );
    `)
    const applied = new Set(
        (db.prepare("SELECT version FROM schema_migrations").all() as Array<{ version: number }>)
            .map((row) => row.version),
    )
    const record = db.prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)")

    for (const migration of migrations) {
        if (migration.version > maxMigrationVersion) continue
        if (applied.has(migration.version)) continue
        if (migration.disableForeignKeys) db.pragma("foreign_keys = OFF")
        try {
            db.transaction(() => {
                migration.run(db)
                record.run(migration.version, migration.name, new Date().toISOString())
                db.pragma(`user_version = ${migration.version}`)
            })()
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error)
            throw new Error(`Database migration ${migration.version} (${migration.name}) failed: ${detail}`, { cause: error })
        } finally {
            if (migration.disableForeignKeys) db.pragma("foreign_keys = ON")
        }
    }
}
