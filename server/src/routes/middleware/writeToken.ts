import type { Request, Response, NextFunction } from "express"
import { createHash, timingSafeEqual } from "node:crypto"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

function tokensMatch(actual: unknown, expected: string): boolean {
    if (typeof actual !== "string") return false

    const actualDigest = createHash("sha256").update(actual).digest()
    const expectedDigest = createHash("sha256").update(expected).digest()
    return timingSafeEqual(actualDigest, expectedDigest)
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
        next()
    }
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
