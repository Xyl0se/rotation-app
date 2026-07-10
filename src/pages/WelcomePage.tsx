import Button from "../components/ui/Button"

type WelcomePageProps = {
    onContinue: () => void
}

function WelcomePage({
    onContinue,
}: WelcomePageProps) {

    return (

        <main className="welcome">

            <h1>Rotation</h1>

            <h2>

                Musik verändert sich nicht.

                <br />

                Deine Beziehung zu ihr schon.

            </h2>

            <p>

                Rotation hilft dir dabei,

                Alben bewusst zu hören,

                sie wiederzuentdecken

                und deine persönliche Bibliothek

                über viele Jahre wachsen zu lassen.

            </p>

            <Button onClick={onContinue}>

                Meine Bibliothek beginnen

            </Button>

            <small>

                Version 0.1

            </small>

        </main>

    )

}

export default WelcomePage