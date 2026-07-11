import type {
    CoachQuestion as CoachQuestionModel,
} from "../../../domain/album/coachQuestions"

import { useI18n } from "../../../i18n/useI18n"

type CoachQuestionProps = {

    albumTitle: string

    question: CoachQuestionModel

    onAnswer: (answer: boolean) => void

}

function CoachQuestion({

    albumTitle,

    question,

    onAnswer,

}: CoachQuestionProps) {
    const { t } = useI18n()

    return (

        <section className="coach-question">

            <p className="coach-album-title">

                {albumTitle}

            </p>

            <h2>

                {question.title}

            </h2>

            {

                question.description && (

                    <p>

                        {question.description}

                    </p>

                )

            }

            <div className="coach-actions">

                <button
                    onClick={() => onAnswer(true)}
                >
                    {t.common.yes}
                </button>

                <button
                    onClick={() => onAnswer(false)}
                >
                    {t.common.no}
                </button>

            </div>

        </section>

    )

}

export default CoachQuestion