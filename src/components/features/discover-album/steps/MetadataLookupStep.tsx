import Button from "../../../ui/Button"

type MetadataLookupState =
    | "idle"
    | "searching"
    | "success"
    | "not-found"
    | "error"

type MetadataLookupStepProps = {

    loading: boolean

    state?: MetadataLookupState

    onSearch: () => void

    onSkip: () => void

}

function MetadataLookupStep({

    loading,

    state = "idle",

    onSearch,

    onSkip,

}: MetadataLookupStepProps) {

    function renderStatus() {

        switch (state) {

            case "searching":

                return (

                    <p>

                        🎵 Rotation sucht nach deinem Album …

                    </p>

                )

            case "success":

                return (

                    <p>

                        ✅ Albumdaten gefunden.
                        Cover und Erscheinungsjahr
                        wurden ergänzt.

                    </p>

                )

            case "not-found":

                return (

                    <p>

                        📦 Leider konnten keine
                        Albumdaten gefunden werden.
                        Du kannst das Album trotzdem
                        ganz normal hinzufügen.

                    </p>

                )

            case "error":

                return (

                    <p>

                        🌐 Die Albumdaten konnten
                        gerade nicht geladen werden.
                        Wir machen trotzdem weiter.

                    </p>

                )

            default:

                return null

        }

    }

    return (

        <section>

            <h2>

                Albumdaten ergänzen

            </h2>

            <p>

                Rotation kann automatisch
                weitere Informationen
                zu deinem Album ergänzen.

            </p>

            <ul className="metadata-feature-list">

                <li>

                    <span aria-hidden="true">

                        🖼

                    </span>

                    <span>

                        Albumcover

                    </span>

                </li>

                <li>

                    <span aria-hidden="true">

                        📅

                    </span>

                    <span>

                        Erscheinungsjahr

                    </span>

                </li>

            </ul>

            {renderStatus()}

            <div className="dialog-actions">

                <Button

                    onClick={onSearch}

                    disabled={loading}

                >

                    {

                        loading

                            ? "Suche läuft …"

                            : "Album suchen"

                    }

                </Button>

                <Button

                    variant="secondary"

                    onClick={onSkip}

                    disabled={loading}

                >

                    Überspringen

                </Button>

            </div>

        </section>

    )

}

export default MetadataLookupStep
