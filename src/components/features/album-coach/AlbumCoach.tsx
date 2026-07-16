import { useState } from "react"

import CoachIntro from "./CoachIntro"
import CoachQuestion from "./CoachQuestion"
import CoachResult from "./CoachResult"

import { coachQuestionIds } from "../../../domain/album/coachQuestions"

import {
    evaluateCoach,
} from "../../../domain/album/evaluateCoach"

import type {
    AlbumCoachAnswers,
} from "../../../domain/album/determineRole"

import type {
    RoleId,
} from "../../../domain/roles"
import type { Album } from "../../../types/album"

type AlbumCoachProps = {

    albumTitle: string

    onComplete: (role: RoleId) => void

    album: Pick<Album, "id" | "coverUrl" | "coverOverride">

}

function AlbumCoach({

    albumTitle,

    onComplete,
    album,

}: AlbumCoachProps) {

    const [started, setStarted] = useState(false)

    const [answers, setAnswers] =
        useState<Partial<AlbumCoachAnswers>>({})

    const evaluation =
        evaluateCoach(answers)

    function handleAnswer(answer: boolean) {

        if (evaluation.finished) {

            return

        }

        setAnswers({

            ...answers,

            [evaluation.nextQuestion]: answer,

        })

    }

    if (!started) {

        return (

            <CoachIntro

                albumTitle={albumTitle}
                albumId={album.id}
                coverUrl={album.coverUrl}
                coverOverride={album.coverOverride}

                onStart={() =>

                    setStarted(true)

                }

            />

        )

    }

    if (evaluation.finished) {

        return (

            <CoachResult

                albumTitle={albumTitle}

                role={evaluation.role}

                onAccept={() =>

                    onComplete(evaluation.role)

                }

            />

        )

    }

    return (

        <CoachQuestion

            albumTitle={albumTitle}

            questionId={coachQuestionIds[evaluation.nextQuestion]}

            onAnswer={handleAnswer}

        />

    )

}

export default AlbumCoach
