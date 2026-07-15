import Button from "../../ui/Button"

type CoachOrphanPromptProps = {
    title: string
    description: string
    dismissLabel: string
    captureLabel: string
    onDismiss: () => void
    onCapture: () => void
}

function CoachOrphanPrompt({
    title,
    description,
    dismissLabel,
    captureLabel,
    onDismiss,
    onCapture,
}: CoachOrphanPromptProps) {
    return (
        <div className="coach-orphan-prompt">
            <h3 className="coach-orphan-prompt__title">{title}</h3>
            <p className="coach-orphan-prompt__description">{description}</p>
            <div className="coach-orphan-prompt__actions">
                <Button variant="secondary" onClick={onDismiss}>
                    {dismissLabel}
                </Button>
                <Button onClick={onCapture}>{captureLabel}</Button>
            </div>
        </div>
    )
}

export default CoachOrphanPrompt
