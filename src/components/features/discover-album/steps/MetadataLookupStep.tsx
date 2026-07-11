import Button from "../../../ui/Button"
import { useI18n } from "../../../../i18n/I18nContext"

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
    const { t } = useI18n()
    const meta = t.discoverAlbum.steps.metadata

    function renderStatus() {
        switch (state) {
            case "searching":
                return <p>{meta.searchingStatus(t.header.title)}</p>
            case "success":
                return <p>{meta.successStatus}</p>
            case "not-found":
                return <p>{meta.notFoundStatus}</p>
            case "error":
                return <p>{meta.errorStatus}</p>
            default:
                return null
        }
    }

    return (
        <section>
            <h2>{meta.title}</h2>
            <p>{meta.description}</p>

            <ul className="metadata-feature-list">
                <li>
                    <span aria-hidden="true">🖼</span>
                    <span>{meta.coverFeature}</span>
                </li>
                <li>
                    <span aria-hidden="true">📅</span>
                    <span>{meta.yearFeature}</span>
                </li>
            </ul>

            {renderStatus()}

            <div className="dialog-actions">
                <Button
                    onClick={onSearch}
                    disabled={loading}
                >
                    {loading ? meta.searching : meta.searchButton}
                </Button>
                <Button
                    variant="secondary"
                    onClick={onSkip}
                    disabled={loading}
                >
                    {meta.skip}
                </Button>
            </div>
        </section>
    )
}

export default MetadataLookupStep
