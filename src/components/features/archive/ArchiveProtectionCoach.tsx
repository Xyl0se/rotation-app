import { useState } from "react"

import {
    archiveProtectionQuestions,
} from "../../../domain/archive/archiveProtectionQuestions"

import {
    evaluateArchiveProtection,
    type ArchiveProtectionAnswers,
} from "../../../domain/archive/evaluateArchiveProtection"

import { explainRole } from "../../../domain/album/explainRole"

import {
    roles,
    type RoleId,
} from "../../../domain/roles"

import Button from "../../ui/Button"

type ArchiveProtectionCoachProps = {

    albumTitle: string

    onComplete: (role: RoleId) => void

}

function ArchiveProtectionCoach({

    albumTitle,

    onComplete,

}: ArchiveProtectionCoachProps) {

    const [answers, setAnswers] =
        useState<Partial<ArchiveProtectionAnswers>>({})

    const evaluation =
        evaluateArchiveProtection(answers)

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
                        ? "Dieses Album darf ruhen"
                        : "Dieses Album bleibt geschützt"}

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
        archiveProtectionQuestions[
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

        </section>

    )

}

export default ArchiveProtectionCoach
