import { useI18n } from "../../../i18n/useI18n"
import type { CoverOverride } from "../../../types/album"
import AlbumCover from "../../ui/AlbumCover"

type CoachIntroProps = {

    albumTitle: string

    onStart: () => void
    albumId: string
    coverUrl?: string
    coverOverride?: CoverOverride

}

function CoachIntro({

    albumTitle,

    onStart,
    albumId,
    coverUrl,
    coverOverride,

}: CoachIntroProps) {
    const { t } = useI18n()

    return (

        <section className="album-coach coach-intro">

            <h2>

                Album Coach

            </h2>

            <h1>

                {albumTitle}

            </h1>

            {(coverUrl || coverOverride) && (
                <AlbumCover
                    albumId={albumId}
                    title={albumTitle}
                    alt={albumTitle}
                    coverUrl={coverUrl}
                    coverOverride={coverOverride}
                    className="coach-intro-cover"
                    lazy={false}
                />
            )}

            <p>

                {t.coach.intro.line1}

            </p>

            <p>

                {t.coach.intro.line2} {t.coach.intro.line3}

            </p>

            <p>

                {t.coach.intro.cta(albumTitle)}

            </p>

            <button

                onClick={onStart}

            >

                {t.coach.intro.start}

            </button>

        </section>

    )

}

export default CoachIntro
