import type { ErrorRequestHandler } from "express"

interface HttpParserError extends Error {
    status?: number
    type?: string
}

export function createApiErrorHandler(
    reportUnexpected: (error: unknown) => void = () => {},
): ErrorRequestHandler {
    return (error: unknown, _req, res, _next) => {
        void _req
        void _next
        const parserError = error as HttpParserError
        if (parserError.status === 400 && parserError.type === "entity.parse.failed") {
            res.status(400).json({
                code: "INVALID_JSON",
                error: "Malformed JSON body",
            })
            return
        }

        reportUnexpected(error)
        res.status(500).json({
            code: "INTERNAL_ERROR",
            error: "Internal server error",
        })
    }
}
