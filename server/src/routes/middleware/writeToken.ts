import type { Request, Response, NextFunction } from "express"
import { createHash, timingSafeEqual } from "node:crypto"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

function tokensMatch(actual: unknown, expected: string): boolean {
    if (typeof actual !== "string") return false

    const actualDigest = createHash("sha256").update(actual).digest()
    const expectedDigest = createHash("sha256").update(expected).digest()
    return timingSafeEqual(actualDigest, expectedDigest)
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
    const raw = Array.isArray(value) ? value[0] : value
    return raw?.split(",")[0]?.trim()
}

function isTrustedBrowserRequest(req: Request): boolean {
    const fetchSite = firstHeaderValue(req.headers["sec-fetch-site"])
    if (fetchSite === "cross-site") return false

    const origin = firstHeaderValue(req.headers.origin)
    if (!origin) return true // trusted CLI/internal caller still needs the secret

    try {
        const parsedOrigin = new URL(origin)
        const forwardedHost = firstHeaderValue(req.headers["x-forwarded-host"])
        const expectedHost = forwardedHost ?? firstHeaderValue(req.headers.host)
        if (!expectedHost || parsedOrigin.host !== expectedHost) return false

        const forwardedProto = firstHeaderValue(req.headers["x-forwarded-proto"])
        if (forwardedProto && parsedOrigin.protocol !== `${forwardedProto}:`) return false
        return true
    } catch {
        return false
    }
}

export function createRequireWriteToken(writeToken: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const token = req.headers["x-rotation-write-token"]
        if (!tokensMatch(token, writeToken)) {
            res.status(403).json({
                code: "INVALID_WRITE_TOKEN",
                error: "Forbidden: invalid or missing write token",
            })
            return
        }
        if (!isTrustedBrowserRequest(req)) {
            res.status(403).json({
                code: "CROSS_SITE_MUTATION",
                error: "Forbidden: cross-site mutation",
            })
            return
        }
        next()
    }
}

export function requireSameOriginForMutations(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    if (SAFE_METHODS.has(req.method.toUpperCase()) || isTrustedBrowserRequest(req)) {
        next()
        return
    }
    res.status(403).json({
        code: "CROSS_SITE_MUTATION",
        error: "Forbidden: cross-site mutation",
    })
}

export function createRequireWriteTokenForMutations(writeToken: string) {
    const requireWriteToken = createRequireWriteToken(writeToken)

    return (req: Request, res: Response, next: NextFunction): void => {
        if (SAFE_METHODS.has(req.method.toUpperCase())) {
            next()
            return
        }
        requireWriteToken(req, res, next)
    }
}
