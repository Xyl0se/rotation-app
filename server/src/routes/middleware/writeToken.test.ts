import { describe, expect, it, vi } from "vitest"
import type { NextFunction, Request, Response } from "express"
import {
    createRequireWriteToken,
    createRequireWriteTokenForMutations,
    requireSameOriginForMutations,
} from "./writeToken.js"

function request(method: string, token?: string, headers: Record<string, string> = {}): Request {
    return {
        method,
        headers: {
            ...headers,
            ...(token ? { "x-rotation-write-token": token } : {}),
        },
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

    it("accepts a same-origin mutation forwarded by the trusted proxy", () => {
        const res = response()
        const next = vi.fn() as NextFunction

        createRequireWriteToken("server-secret")(request("POST", "server-secret", {
            origin: "http://rotation.local:3000",
            "x-forwarded-host": "rotation.local:3000",
            "x-forwarded-proto": "http",
            "sec-fetch-site": "same-origin",
        }), res.value, next)

        expect(next).toHaveBeenCalledOnce()
    })

    it("accepts an HTTPS origin when TLS terminates before the HTTP web container", () => {
        const res = response()
        const next = vi.fn() as NextFunction

        createRequireWriteToken("server-secret")(request("POST", "server-secret", {
            origin: "https://rotation.example:8443",
            "x-forwarded-host": "rotation.example:8443",
            "x-forwarded-proto": "http",
            "sec-fetch-site": "same-origin",
        }), res.value, next)

        expect(next).toHaveBeenCalledOnce()
        expect(res.status).not.toHaveBeenCalled()
    })

    it("accepts browser-confirmed same-origin mutations when a NAS proxy rewrites the host", () => {
        const res = response()
        const next = vi.fn() as NextFunction

        createRequireWriteToken("server-secret")(request("POST", "server-secret", {
            origin: "https://rotation.example",
            "x-forwarded-host": "rotation-web",
            "sec-fetch-site": "same-origin",
        }), res.value, next)

        expect(next).toHaveBeenCalledOnce()
        expect(res.status).not.toHaveBeenCalled()
    })

    it("rejects a cross-site mutation even with the internal token", () => {
        const res = response()
        const next = vi.fn() as NextFunction

        createRequireWriteToken("server-secret")(request("POST", "server-secret", {
            origin: "https://evil.example",
            "x-forwarded-host": "rotation.local:3000",
            "sec-fetch-site": "cross-site",
        }), res.value, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
            code: "CROSS_SITE_MUTATION",
            error: "Forbidden: cross-site mutation",
            diagnostic: {
                reason: "fetch-metadata-cross-site",
                fetchSite: "cross-site",
            },
        })
        expect(next).not.toHaveBeenCalled()
    })

    it("accepts a rewritten proxy host when Fetch Metadata is unavailable", () => {
        const res = response()
        const next = vi.fn() as NextFunction

        createRequireWriteToken("server-secret")(request("POST", "server-secret", {
            origin: "https://evil.example",
            "x-forwarded-host": "rotation.local:3000",
        }), res.value, next)

        expect(next).toHaveBeenCalledOnce()
        expect(res.status).not.toHaveBeenCalled()
    })

    it("accepts same-site Fetch Metadata despite rewritten proxy host", () => {
        const res = response()
        const next = vi.fn() as NextFunction

        createRequireWriteToken("server-secret")(request("POST", "server-secret", {
            origin: "http://evil.example",
            "x-forwarded-host": "rotation.local:3000",
            "x-forwarded-proto": "http",
            "sec-fetch-site": "same-site",
        }), res.value, next)

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

    it("protects a token-free mutation from cross-site browsers", () => {
        const res = response()
        const next = vi.fn() as NextFunction

        requireSameOriginForMutations(request("POST", undefined, {
            origin: "https://evil.example",
            "x-forwarded-host": "rotation.local:3000",
            "sec-fetch-site": "cross-site",
        }), res.value, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(next).not.toHaveBeenCalled()
    })
})
