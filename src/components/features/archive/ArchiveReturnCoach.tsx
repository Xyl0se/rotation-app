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
import { useI18n } from "../../../i18n/useI18n"

type ArchiveReturnCoachProps = {

    albumTitle: string

    onComplete: (role: RoleId) => void

}

function ArchiveReturnCoach({

    albumTitle,

    onComplete,

}: ArchiveReturnCoachProps) {
    const { t } = useI18n()

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
                        ? t.archive.return.keepArchived
                        : t.archive.return.allowReturn}

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

                    {t.archive.return.accept}

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

                            {t.common.yes}

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

                            {t.common.no}

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
