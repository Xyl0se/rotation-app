import { useI18n } from "../../../i18n/useI18n"

interface EmptyFocusAlbumCardProps {
    hasActiveRotation: boolean
    onSuggest: () => void
    isRotationComplete?: boolean
    remainingAlbumCount?: number
    rotationAlbumCount?: number
}

export default function EmptyFocusAlbumCard({ hasActiveRotation, onSuggest, isRotationComplete = false, remainingAlbumCount, rotationAlbumCount }: EmptyFocusAlbumCardProps) {
    const { t } = useI18n()

    return (
        <section className="focus-album focus-album--empty">
            <div className="focus-album-heading">
                <p className="focus-album-label">{t.focusAlbum.label}</p>
                <button
                    className="focus-album-shuffle"
                    onClick={onSuggest}
                    disabled={!hasActiveRotation || isRotationComplete}
                    aria-label={t.home.suggestFocusAlbum}
                    title={isRotationComplete ? t.focusAlbum.rotationComplete : hasActiveRotation ? t.home.suggestFocusAlbum : t.focusAlbum.needsRotation}
                >
                    🎲
                </button>
            </div>
            <div className="focus-album-empty-card">
                <span className="focus-album-empty-icon" aria-hidden="true">◎</span>
                <div>
                    <h2>{isRotationComplete ? t.focusAlbum.rotationCompleteTitle : t.focusAlbum.emptyTitle}</h2>
                    <p>{isRotationComplete
                        ? t.focusAlbum.rotationComplete
                        : hasActiveRotation ? t.focusAlbum.emptyDescription : t.focusAlbum.needsRotation}</p>
                    {typeof remainingAlbumCount === "number" && (rotationAlbumCount ?? 0) > 0 && !isRotationComplete && (
                        <p className="focus-album-progress" role="status">
                            {t.focusAlbum.remainingInRotation(remainingAlbumCount, rotationAlbumCount ?? 0)}
                        </p>
                    )}
                </div>
            </div>
        </section>
    )
}
