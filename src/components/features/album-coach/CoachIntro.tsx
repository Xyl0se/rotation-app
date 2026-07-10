type CoachIntroProps = {

    albumTitle: string

    onStart: () => void

}

function CoachIntro({

    albumTitle,

    onStart,

}: CoachIntroProps) {

    return (

        <section className="coach-intro">

            <h2>

                Album Coach

            </h2>

            <h1>

                {albumTitle}

            </h1>

            <p>

                Jedes Album spielt im Laufe der Zeit
                eine andere Rolle.

            </p>

            <p>

                Manche begleiten uns über Jahre.
                Andere wachsen langsam.
                Wieder andere dürfen irgendwann
                ihren Platz im Archiv finden.

            </p>

            <p>

                Lass uns gemeinsam herausfinden,
                welche Rolle <strong>{albumTitle}</strong>
                heute für dich spielt.

            </p>

            <button

                onClick={onStart}

            >

                Los geht's

            </button>

        </section>

    )

}

export default CoachIntro