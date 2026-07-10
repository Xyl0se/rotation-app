import type {
    ReflectionPrompt,
} from "../../../domain/reflection/evaluateReflection"

import {
    getReflectionMessage,
} from "../../../domain/reflection/reflectionMessages"

import Button from "../../ui/Button"

type ReflectionCardProps = {

    prompt?: ReflectionPrompt

    onReflect?: () => void

}

function ReflectionCard({

    prompt,

    onReflect,

}: ReflectionCardProps) {

    if (!prompt) {

        return (

            <section className="reflection-card">

                <p className="reflection-label">

                    Reflexion

                </p>

                <h2>

                    Gerade keine offene Frage

                </h2>

                <p>

                    Deine Sammlung wirkt im Moment stimmig.
                    Wenn ein Album wieder Aufmerksamkeit braucht,
                    fragt Rotation hier nach.

                </p>

            </section>

        )

    }

    const message =
        getReflectionMessage(prompt)

    return (

        <section className="reflection-card">

            <p className="reflection-label">

                Reflexion

            </p>

            <h2>

                {message.title}

            </h2>

            <h3>

                {prompt.album.title}

            </h3>

            <p>

                {message.description}

            </p>

            <Button onClick={onReflect}>

                {message.actionLabel}

            </Button>

        </section>

    )

}

export default ReflectionCard
