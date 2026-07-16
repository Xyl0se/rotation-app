import { useI18n } from "../../../i18n/useI18n"

interface EmptyFocusAlbumCardProps {
    hasActiveRotation: boolean
    onSuggest: () => void
}

export default function EmptyFocusAlbumCard({ hasActiveRotation, onSuggest }: EmptyFocusAlbumCardProps) {
    const { t } = useI18n()

    return (
        <section className="focus-album focus-album--empty">
            <div className="focus-album-heading">
                <p className="focus-album-label">{t.focusAlbum.label}</p>
                <button
                    className="focus-album-shuffle"
                    onClick={onSuggest}
                    disabled={!hasActiveRotation}
                    aria-label={t.home.suggestFocusAlbum}
                    title={hasActiveRotation ? t.home.suggestFocusAlbum : t.focusAlbum.needsRotation}
                >
                    🎲
                </button>
            </div>
            <div className="focus-album-empty-card">
                <span className="focus-album-empty-icon" aria-hidden="true">◎</span>
                <div>
                    <h2>{t.focusAlbum.emptyTitle}</h2>
                    <p>{hasActiveRotation ? t.focusAlbum.emptyDescription : t.focusAlbum.needsRotation}</p>
                </div>
            </div>
        </section>
    )
}
