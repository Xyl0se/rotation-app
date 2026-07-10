import { useState } from "react"

import {
    archiveReturnQuestions,
} from "../../../domain/archive/archiveReturnQuestions"

import {
    evaluateArchiveReturn,
    type ArchiveReturnAnswers,
} from "../../../domain/archive/evaluateArchiveReturn"

import { explainRole } from "../../../domain/album/explainRole"

import {
    roles,
    type RoleId,
} from "../../../domain/roles"

import Button from "../../ui/Button"

type ArchiveReturnCoachProps = {

    albumTitle: string

    onComplete: (role: RoleId) => void

}

function ArchiveReturnCoach({

    albumTitle,

    onComplete,

}: ArchiveReturnCoachProps) {

    const [answers, setAnswers] =
        useState<Partial<ArchiveReturnAnswers>>({})

    const evaluation =
        evaluateArchiveReturn(answers)

    if (evaluation.finished) {

        const role =
            roles.find(item => item.id === evaluation.role)

        return (

            <section className="archive-coach">

                <p className="coach-album-title">

                    {albumTitle}

                </p>

                <h2>

                    {evaluation.role === "archive"
                        ? "Dieses Album bleibt im Archiv"
                        : "Dieses Album darf zurückkehren"}

                </h2>

                <h1>

                    {role?.icon} {role?.title}

                </h1>

                <p>

                    {explainRole(evaluation.role)}

                </p>

                <Button
                    onClick={() =>
                        onComplete(evaluation.role)
                    }
                >

                    Entscheidung übernehmen

                </Button>

            </section>

        )

    }

    const question =
        archiveReturnQuestions[
            evaluation.nextQuestion
        ]

    return (

        <section className="archive-coach">

            <p className="coach-album-title">

                {albumTitle}

            </p>

            <h2>

                {question.title}

            </h2>

            <p>

                {question.description}

            </p>

            {
                question.type === "boolean" && (

                    <div className="coach-actions">

                        <Button
                            onClick={() =>
                                setAnswers({
                                    ...answers,
                                    [question.id]: true,
                                })
                            }
                        >

                            Ja

                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() =>
                                setAnswers({
                                    ...answers,
                                    [question.id]: false,
                                })
                            }
                        >

                            Nein

                        </Button>

                    </div>

                )
            }

            {
                question.type === "choice" && (

                    <div className="archive-choice-list">

                        {
                            question.options.map(option => (

                                <Button
                                    key={option.value}
                                    variant="secondary"
                                    onClick={() =>
                                        setAnswers({
                                            ...answers,
                                            [question.id]:
                                                option.value,
                                        })
                                    }
                                >

                                    {option.label}

                                </Button>

                            ))
                        }

                    </div>

                )
            }

        </section>

    )

}

export default ArchiveReturnCoach
