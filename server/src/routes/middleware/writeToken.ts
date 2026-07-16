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

interface BrowserTrustResult {
    trusted: boolean
    reason?: "fetch-metadata-cross-site" | "invalid-origin" | "origin-host-mismatch"
    fetchSite?: string
    originHost?: string
    expectedHost?: string
}

function evaluateBrowserTrust(req: Request): BrowserTrustResult {
    const fetchSite = firstHeaderValue(req.headers["sec-fetch-site"])
    if (fetchSite === "cross-site") {
        return { trusted: false, reason: "fetch-metadata-cross-site", fetchSite }
    }

    // Sec-Fetch-Site is a forbidden request header controlled by the browser. It is
    // the most reliable signal when an upstream NAS proxy rewrites Host headers.
    if (fetchSite === "same-origin") return { trusted: true, fetchSite }

    const origin = firstHeaderValue(req.headers.origin)
    if (!origin) return { trusted: true, fetchSite } // CLI/internal caller still needs the secret

    try {
        const parsedOrigin = new URL(origin)
        const forwardedHost = firstHeaderValue(req.headers["x-forwarded-host"])
        const expectedHost = forwardedHost ?? firstHeaderValue(req.headers.host)
        if (!expectedHost || parsedOrigin.host !== expectedHost) {
            return {
                trusted: false,
                reason: "origin-host-mismatch",
                fetchSite,
                originHost: parsedOrigin.host,
                expectedHost,
            }
        }
        return { trusted: true, fetchSite }
    } catch {
        return { trusted: false, reason: "invalid-origin", fetchSite }
    }
}

function rejectUntrustedBrowserRequest(res: Response, result: BrowserTrustResult): void {
    res.status(403).json({
        code: "CROSS_SITE_MUTATION",
        error: result.reason === "origin-host-mismatch"
            ? "Forbidden: request Origin does not match proxy host; check NAS reverse-proxy Host forwarding"
            : "Forbidden: cross-site mutation",
        diagnostic: {
            reason: result.reason,
            fetchSite: result.fetchSite ?? null,
            originHost: result.originHost ?? null,
            expectedHost: result.expectedHost ?? null,
        },
    })
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
        const trust = evaluateBrowserTrust(req)
        if (!trust.trusted) {
            rejectUntrustedBrowserRequest(res, trust)
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
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
        next()
        return
    }
    const trust = evaluateBrowserTrust(req)
    if (trust.trusted) {
        next()
        return
    }
    rejectUntrustedBrowserRequest(res, trust)
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
