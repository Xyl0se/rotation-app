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
    reason?: "fetch-metadata-cross-site"
    fetchSite?: string
}

function evaluateBrowserTrust(req: Request): BrowserTrustResult {
    const fetchSite = firstHeaderValue(req.headers["sec-fetch-site"])
    if (fetchSite === "cross-site") {
        return { trusted: false, reason: "fetch-metadata-cross-site", fetchSite }
    }

    // Host and protocol are not stable across Synology/NAS reverse proxies. The
    // browser-controlled Fetch Metadata header is therefore the only cross-site
    // signal enforced here. The internal token remains mandatory on protected routes.
    return { trusted: true, fetchSite }
}

function rejectUntrustedBrowserRequest(res: Response, result: BrowserTrustResult): void {
    res.status(403).json({
        code: "CROSS_SITE_MUTATION",
        error: "Forbidden: cross-site mutation",
        diagnostic: {
            reason: result.reason,
            fetchSite: result.fetchSite ?? null,
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
