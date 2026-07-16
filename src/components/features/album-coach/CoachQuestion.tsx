import type { CoachQuestionId } from "../../../domain/album/evaluateCoach"
import { useI18n } from "../../../i18n/useI18n"

type CoachQuestionProps = {
    albumTitle: string
    questionId: CoachQuestionId
    onAnswer: (answer: boolean) => void
}

function CoachQuestion({ albumTitle, questionId, onAnswer }: CoachQuestionProps) {
    const { t } = useI18n()
    const question = t.coach.questions[questionId]

    return (
        <section className="album-coach coach-question">
            <p className="coach-album-title">{albumTitle}</p>
            <h2>{question.title}</h2>
            {question.description && <p>{question.description}</p>}
            <div className="coach-actions">
                <button onClick={() => onAnswer(true)}>{t.common.yes}</button>
                <button onClick={() => onAnswer(false)}>{t.common.no}</button>
            </div>
        </section>
    )
}

export default CoachQuestion
