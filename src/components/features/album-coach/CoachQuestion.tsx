import type {
    CoachQuestion as CoachQuestionModel,
} from "../../../domain/album/coachQuestions"

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
                    Ja
                </button>

                <button
                    onClick={() => onAnswer(false)}
                >
                    Nein
                </button>

            </div>

        </section>

    )

}

export default CoachQuestion