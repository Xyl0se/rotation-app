import type { Request, Response, NextFunction } from "express"

export function createRequireWriteToken(writeToken: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const token = req.headers["x-rotation-write-token"]
        if (token !== writeToken) {
            res.status(403).json({ error: "Forbidden: invalid or missing write token" })
            return
        }
        next()
    }
}
