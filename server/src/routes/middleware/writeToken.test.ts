import { describe, expect, it, vi } from "vitest"
import type { NextFunction, Request, Response } from "express"
import {
    createRequireWriteToken,
    createRequireWriteTokenForMutations,
} from "./writeToken.js"

function request(method: string, token?: string): Request {
    return {
        method,
        headers: token ? { "x-rotation-write-token": token } : {},
    } as Request
}

function response() {
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    return {
        value: { status } as unknown as Response,
        status,
        json,
    }
}

describe("write-token middleware", () => {
    it("rejects a missing token without exposing the expected token", () => {
        const res = response()
        const next = vi.fn() as NextFunction

        createRequireWriteToken("server-secret")(request("POST"), res.value, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
            code: "INVALID_WRITE_TOKEN",
            error: "Forbidden: invalid or missing write token",
        })
        expect(JSON.stringify(res.json.mock.calls)).not.toContain("server-secret")
        expect(next).not.toHaveBeenCalled()
    })

    it("rejects an invalid token", () => {
        const res = response()
        const next = vi.fn() as NextFunction

        createRequireWriteToken("server-secret")(request("DELETE", "wrong"), res.value, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
    })

    it("accepts a valid token", () => {
        const res = response()
        const next = vi.fn() as NextFunction

        createRequireWriteToken("server-secret")(request("PUT", "server-secret"), res.value, next)

        expect(next).toHaveBeenCalledOnce()
        expect(res.status).not.toHaveBeenCalled()
    })

    it.each(["GET", "HEAD", "OPTIONS"])("allows safe %s requests without a token", (method) => {
        const res = response()
        const next = vi.fn() as NextFunction

        createRequireWriteTokenForMutations("server-secret")(request(method), res.value, next)

        expect(next).toHaveBeenCalledOnce()
        expect(res.status).not.toHaveBeenCalled()
    })

    it.each(["POST", "PUT", "PATCH", "DELETE"])("protects mutating %s requests", (method) => {
        const res = response()
        const next = vi.fn() as NextFunction

        createRequireWriteTokenForMutations("server-secret")(request(method), res.value, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
    })
})
