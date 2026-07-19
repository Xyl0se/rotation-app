import type { AlbumSource } from "../domain/albumTypes.js"

interface MusicBrainzRelation { type?: string; url?: { resource?: string } }
interface WikidataEntity { sitelinks?: Record<string, { title?: string; url?: string }> }

export interface ExternalSourceResolverOptions {
    fetchImpl?: typeof fetch
    delay?: (milliseconds: number) => Promise<void>
    timeoutMs?: number
    now?: () => number
}

export interface MusicBrainzReleaseCandidate {
    releaseId: string
    releaseGroupId?: string
    title: string
    artist: string
    year?: string
}

const USER_AGENT = "Rotation/0.30.0 (https://github.com/Xyl0se/rotation-app)"
const wait = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds))

function safeUrl(value: unknown): URL | null {
    if (typeof value !== "string") return null
    try {
        const url = new URL(value)
        return url.protocol === "https:" && !url.username && !url.password && !url.port ? url : null
    } catch {
        return null
    }
}

function wikipediaSource(url: URL, resolvedAt: string): AlbumSource | null {
    const match = url.hostname.match(/^(de|en)\.wikipedia\.org$/)
    if (!match || !url.pathname.startsWith("/wiki/") || url.pathname.length <= 6) return null
    return {
        provider: "wikipedia",
        externalId: decodeURIComponent(url.pathname.slice(6)),
        url: url.href,
        locale: match[1] as "de" | "en",
        resolutionStatus: "resolved",
        resolvedAt,
        confirmedByUser: false,
    }
}

async function requestJson(fetchImpl: typeof fetch, url: string, timeoutMs: number, delay: (milliseconds: number) => Promise<void>, headers: HeadersInit = {}) {
    let lastError: unknown
    for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await delay(1_000)
        try {
            const response = await fetchImpl(url, { headers: { Accept: "application/json", ...headers }, signal: AbortSignal.timeout(timeoutMs) })
            if (!response.ok) throw new Error(`Provider request failed (${response.status})`)
            return await response.json() as unknown
        } catch (error) {
            lastError = error
        }
    }
    throw lastError
}

export function createExternalSourceResolver(options: ExternalSourceResolverOptions = {}) {
    const fetchImpl = options.fetchImpl ?? fetch
    const delay = options.delay ?? wait
    const timeoutMs = options.timeoutMs ?? 4_000
    const now = options.now ?? Date.now
    let lastMusicBrainzRequestAt = 0
    let musicBrainzQueue = Promise.resolve()

    const requestMusicBrainz = <T>(operation: () => Promise<T>): Promise<T> => {
        const scheduled = musicBrainzQueue.then(async () => {
            const remaining = 1_000 - (now() - lastMusicBrainzRequestAt)
            if (lastMusicBrainzRequestAt > 0 && remaining > 0) await delay(remaining)
            lastMusicBrainzRequestAt = now()
            return operation()
        })
        musicBrainzQueue = scheduled.then(() => undefined, () => undefined)
        return scheduled
    }

    return async function resolveExternalSources(releaseId: string): Promise<AlbumSource[]> {
        const releaseUrl = `https://musicbrainz.org/ws/2/release/${encodeURIComponent(releaseId)}?inc=url-rels&fmt=json`
        const release = await requestMusicBrainz(() => requestJson(fetchImpl, releaseUrl, timeoutMs, delay, { "User-Agent": USER_AGENT })) as { relations?: MusicBrainzRelation[] }
        const relations = release.relations ?? []
        const resolvedAt = new Date().toISOString()

        const directWikipedia = relations
            .filter(relation => relation.type === "wikipedia")
            .map(relation => safeUrl(relation.url?.resource))
            .filter((url): url is URL => url !== null)
            .map(url => wikipediaSource(url, resolvedAt))
            .filter((source): source is AlbumSource => source !== null)
        const uniqueDirect = [...new Map(directWikipedia.map(source => [source.url, source])).values()]
        if (uniqueDirect.length === 1) return uniqueDirect
        if (uniqueDirect.length > 1) return []

        const wikidataIds = [...new Set(relations
            .filter(relation => relation.type === "wikidata")
            .map(relation => safeUrl(relation.url?.resource))
            .filter((url): url is URL => url?.hostname === "www.wikidata.org")
            .map(url => url.pathname.match(/^\/wiki\/(Q[1-9][0-9]*)$/)?.[1])
            .filter((id): id is string => Boolean(id)))]
        if (wikidataIds.length !== 1) return []

        const wikidataId = wikidataIds[0]
        const data = await requestJson(fetchImpl, `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`, timeoutMs, delay) as { entities?: Record<string, WikidataEntity> }
        const entity = data.entities?.[wikidataId]
        const sitelink = entity?.sitelinks?.dewiki ?? entity?.sitelinks?.enwiki
        const articleUrl = safeUrl(sitelink?.url)
        const article = articleUrl ? wikipediaSource(articleUrl, resolvedAt) : null
        const wikidata: AlbumSource = {
            provider: "wikidata", externalId: wikidataId, url: `https://www.wikidata.org/wiki/${wikidataId}`,
            resolutionStatus: "resolved", resolvedAt, confirmedByUser: false,
        }
        return article ? [article, wikidata] : [wikidata]
    }
}

export function createMusicBrainzReleaseSearch(options: ExternalSourceResolverOptions = {}) {
    const fetchImpl = options.fetchImpl ?? fetch
    const delay = options.delay ?? wait
    const timeoutMs = options.timeoutMs ?? 4_000

    return async function searchMusicBrainzReleases(title: string, artist: string): Promise<MusicBrainzReleaseCandidate[]> {
        const escape = (value: string) => value.replace(/([+\-!(){}[\]^"~*?:\\/]|&&|\|\|)/g, "\\$1")
        const query = encodeURIComponent(`release:"${escape(title)}" AND artist:"${escape(artist)}"`)
        const data = await requestJson(fetchImpl, `https://musicbrainz.org/ws/2/release?fmt=json&limit=5&query=${query}`, timeoutMs, delay, { "User-Agent": USER_AGENT }) as {
            releases?: Array<{ id?: string; title?: string; date?: string; "release-group"?: { id?: string }; "artist-credit"?: Array<{ name?: string }> }>
        }
        return (data.releases ?? []).flatMap(release => {
            if (!release.id || !release.title) return []
            return [{
                releaseId: release.id,
                releaseGroupId: release["release-group"]?.id,
                title: release.title,
                artist: release["artist-credit"]?.map(credit => credit.name).filter(Boolean).join(", ") || artist,
                year: release.date?.slice(0, 4),
            }]
        }).slice(0, 5)
    }
}
