import type { AlbumSource } from "../../../types/album"
import { useI18n } from "../../../i18n/useI18n"

function isSafeStoredSource(source: AlbumSource): source is AlbumSource & { url: string } {
    if (source.resolutionStatus !== "resolved" || !source.url) return false
    try {
        const url = new URL(source.url)
        if (url.protocol !== "https:" || url.username || url.password || url.port) return false
        if (source.provider === "musicbrainz") return url.hostname === "musicbrainz.org" && /^\/(release|release-group)\//.test(url.pathname)
        if (source.provider === "wikipedia") return (url.hostname === "de.wikipedia.org" || url.hostname === "en.wikipedia.org") && url.pathname.startsWith("/wiki/")
        return source.provider === "wikidata" && url.hostname === "www.wikidata.org" && url.pathname.startsWith("/wiki/Q")
    } catch {
        return false
    }
}

function selectPresentedSources(sources: AlbumSource[]): Array<AlbumSource & { url: string }> {
    const safe = sources.filter(isSafeStoredSource)
    const musicBrainz = safe.find(source => source.provider === "musicbrainz" && source.url.includes("/release/"))
        ?? safe.find(source => source.provider === "musicbrainz")
    const wikipedia = safe.find(source => source.provider === "wikipedia")
    const wikidata = wikipedia ? undefined : safe.find(source => source.provider === "wikidata")
    return [musicBrainz, wikipedia, wikidata].filter((source): source is AlbumSource & { url: string } => Boolean(source))
}

export default function AlbumExternalSources({ sources }: { sources: AlbumSource[] }) {
    const { t } = useI18n()
    const presented = selectPresentedSources(sources)
    if (presented.length === 0) return null

    return <section className="album-detail-panel album-external-sources" aria-labelledby="album-external-sources-title">
        <div><p className="album-detail-kicker">{t.externalSources.kicker}</p><h2 id="album-external-sources-title">{t.externalSources.title}</h2><p>{t.externalSources.description}</p></div>
        <div className="album-external-source-list">{presented.map(source => <a
            key={`${source.provider}-${source.externalId ?? source.url}`}
            className="album-external-source-card"
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
        >
            <span>{t.externalSources.providers[source.provider]}</span>
            <strong>{t.externalSources.actions[source.provider]}</strong>
            <small>{source.url}</small>
        </a>)}</div>
    </section>
}
