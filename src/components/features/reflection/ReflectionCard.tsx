import type {
    ReflectionPrompt,
} from "../../../domain/reflection/evaluateReflection"

import Button from "../../ui/Button"
import { useI18n } from "../../../i18n/useI18n"

const reflectionTranslationKeys = {
    "new-after-listens": "newAfterListens",
    "growing-for-a-while": "growingForAWhile",
    "comfort-not-recent": "comfortNotRecent",
    "archive-return-candidate": "archiveReturnCandidate",
} as const

type ReflectionCardProps = {

    prompt?: ReflectionPrompt

    onReflect?: () => void

}

function ReflectionCard({

    prompt,

    onReflect,

}: ReflectionCardProps) {
    const { t } = useI18n()

    if (!prompt) {

        return (

            <section className="reflection-card">

                <p className="reflection-label">

                    {t.reflection.empty.label}

                </p>

                <h2>

                    {t.reflection.empty.title}

                </h2>

                <p>

                    {t.reflection.empty.description}

                </p>

            </section>

        )

    }

    const message = t.reflection[reflectionTranslationKeys[prompt.code]]

    return (

        <section className="reflection-card">

            <p className="reflection-label">

                {t.reflection.empty.label}

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

                {message.action}

            </Button>

        </section>

    )

}

export default ReflectionCard
