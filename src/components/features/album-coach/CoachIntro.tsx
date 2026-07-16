import { useI18n } from "../../../i18n/useI18n"

type CoachIntroProps = {

    albumTitle: string

    onStart: () => void

}

function CoachIntro({

    albumTitle,

    onStart,

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
