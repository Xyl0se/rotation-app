import express from "express"
import helmet from "helmet"
import cors from "cors"

import { loadConfig } from "./application/config.js"
import { initDatabase } from "./infrastructure/persistence/sqlite/connection.js"
import { createBindingRepository } from "./infrastructure/persistence/sqlite/bindingRepository.js"
import { createAlbumRepository } from "./infrastructure/persistence/sqlite/albumRepository.js"
import { createExportOperationRepository } from "./infrastructure/persistence/sqlite/exportOperationRepository.js"
import { createExportLockRepository } from "./infrastructure/persistence/sqlite/exportLockRepository.js"
import { createScanRunRepository } from "./infrastructure/persistence/sqlite/scanRunRepository.js"
import { createPathGuard } from "./infrastructure/filesystem/pathGuard.js"
import { createDirectoryScanner } from "./infrastructure/filesystem/directoryScanner.js"
import { createScanService } from "./application/scanService.js"
import { createExportService } from "./application/exportService.js"
import { createCoverService } from "./application/coverService.js"
import { runCrashRecovery } from "./application/crashRecovery.js"
import { createBackupService } from "./application/backupService.js"
import { createBackupStatusRepository } from "./infrastructure/persistence/sqlite/backupStatusRepository.js"
import { createBackupScheduler } from "./application/backupScheduler.js"
import { createBackupsRouter } from "./routes/backups.js"

import { createHealthRouter } from "./routes/health.js"
import { createConfigRouter } from "./routes/config.js"
import { createScanRouter } from "./routes/scan.js"
import { createBindingsRouter } from "./routes/bindings.js"
import { createAlbumsRouter } from "./routes/albums.js"
import { createCoversRouter } from "./routes/covers.js"
import { createExportsRouter } from "./routes/exports.js"
import { createDiagnosticsRouter } from "./routes/diagnostics.js"
import {
    createRequireWriteToken,
    createRequireWriteTokenForMutations,
} from "./routes/middleware/writeToken.js"
import { createApiErrorHandler } from "./routes/middleware/apiError.js"
import { createLogger } from "./infrastructure/logger/logger.js"
import { prepareRuntimeDirectories } from "./application/runtimeDirectories.js"

const config = loadConfig()

// Propagate validated log config to env so logger picks it up
process.env.ROTATION_LOG_LEVEL = config.ROTATION_LOG_LEVEL
process.env.ROTATION_LOG_FORMAT = config.ROTATION_LOG_FORMAT

const log = createLogger("startup")
prepareRuntimeDirectories({
    dataDir: config.ROTATION_DATA_DIR,
    workspacePath: config.ROTATION_WORKSPACE_PATH,
    syncthingRoot: config.ROTATION_SYNCTHING_ROOT,
})
const db = initDatabase()

const bindingRepo = createBindingRepository(db)
const albumRepo = createAlbumRepository(db)
const exportRepo = createExportOperationRepository(db)
const scanRunRepo = createScanRunRepository(db)
const coverService = createCoverService(config.ROTATION_DATA_DIR)

const musicGuard = createPathGuard(config.ROTATION_MUSIC_PATH)
const workspaceGuard = createPathGuard(config.ROTATION_WORKSPACE_PATH)
const syncthingGuard = createPathGuard(config.ROTATION_SYNCTHING_ROOT)

const scanner = createDirectoryScanner(musicGuard)
const scanService = createScanService(scanner, bindingRepo, albumRepo, scanRunRepo)
const lockRepo = createExportLockRepository(db)
const exportService = createExportService(bindingRepo, exportRepo, lockRepo, musicGuard, workspaceGuard, albumRepo)

// Run crash recovery on startup
const recovery = runCrashRecovery(exportRepo, lockRepo, workspaceGuard)
if (recovery.recovered > 0 || recovery.cleanedStagingDirs.length > 0 || recovery.cleanedArchives.length > 0) {
    log.info("Crash recovery completed", recovery as unknown as Record<string, unknown>)
}

const requireWriteToken = createRequireWriteToken(config.ROTATION_WRITE_TOKEN)
const requireWriteTokenForMutations = createRequireWriteTokenForMutations(config.ROTATION_WRITE_TOKEN)

// --- Backup system ---
const backupEnabled = config.ROTATION_BACKUP_ENABLED === "true"
const backupDir = `${config.ROTATION_DATA_DIR}/backups`
const dbPath = `${config.ROTATION_DATA_DIR}/rotation.db`
const backupService = createBackupService(dbPath, backupDir, config.ROTATION_BACKUP_RETENTION_COUNT)
const backupStatusRepo = createBackupStatusRepository(db)
const backupScheduler = createBackupScheduler(
    backupService,
    backupStatusRepo,
    lockRepo,
    config.ROTATION_BACKUP_CRON,
    backupEnabled,
)
backupScheduler.start()

const app = express()

app.use(helmet())
const allowedOrigins = config.ROTATION_CORS_ORIGINS
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
if (allowedOrigins.length > 0) {
    app.use(cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true)
                return
            }
            callback(new Error("Origin not allowed"))
        },
    }))
}

// Raw body parser for cover uploads (must come before express.json())
app.use("/covers", express.raw({ type: "*/*", limit: "5mb" }))

app.use(express.json())

app.use("/health", createHealthRouter(db, config, scanRunRepo))
app.use("/config", createConfigRouter(config))
app.use("/scan", requireWriteToken, createScanRouter(scanService, scanRunRepo, bindingRepo))
app.use("/diagnostics", createDiagnosticsRouter(config, bindingRepo, scanRunRepo, musicGuard, workspaceGuard, syncthingGuard))

app.use("/bindings", requireWriteTokenForMutations, createBindingsRouter(bindingRepo, musicGuard))
app.use("/albums", requireWriteTokenForMutations, createAlbumsRouter(albumRepo))
app.use("/covers", requireWriteTokenForMutations, createCoversRouter(coverService))
app.use("/exports", requireWriteToken, createExportsRouter(exportService))
app.use("/backups", requireWriteToken, createBackupsRouter(backupScheduler, backupStatusRepo, backupService))

app.use((_req, res) => {
    res.status(404).json({ error: "Not found" })
})

const handleUnexpectedError = createApiErrorHandler((error) => {
    log.error("Unhandled API error", {
        name: error instanceof Error ? error.name : "UnknownError",
    })
})
app.use(handleUnexpectedError)

const port = config.PORT
app.listen(port, () => {
    log.info("Rotation API listening", { port })
    log.info("Music path", { path: config.ROTATION_MUSIC_PATH })
    log.info("Workspace path", { path: config.ROTATION_WORKSPACE_PATH })
    log.info("Syncthing root", { path: config.ROTATION_SYNCTHING_ROOT })
    log.info("Backups enabled", {
        enabled: backupEnabled,
        retention: config.ROTATION_BACKUP_RETENTION_COUNT,
        cron: config.ROTATION_BACKUP_CRON,
    })
})
