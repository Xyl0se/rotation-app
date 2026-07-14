/**
 * Low-level API client for the Rotation backend.
 * All calls are relative to /api (proxied by Vite dev server).
 */

import { getWriteToken } from "./writeToken.js"
import { retryFetch } from "./retryFetch.js"

const API_BASE = "/api"

export class ApiError extends Error {
    status: number
    body: unknown
    retryable: boolean

    constructor(status: number, body: unknown, message: string, retryable = false) {
        super(message)
        this.name = "ApiError"
        this.status = status
        this.body = body
        this.retryable = retryable
    }
}

function buildHeaders(requireWrite = false): Record<string, string> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    }
    if (requireWrite) {
        const token = getWriteToken()
        if (token) {
            headers["x-rotation-write-token"] = token
        }
    }
    return headers
}

function isRetryableStatus(status: number): boolean {
    return status >= 500
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new ApiError(
            response.status,
            body,
            body?.error ?? `HTTP ${response.status}`,
            isRetryableStatus(response.status),
        )
    }
    return response.json() as Promise<T>
}

export async function get<T>(path: string): Promise<T> {
    const response = await retryFetch(`${API_BASE}${path}`)
    return handleResponse<T>(response)
}

export async function post<T>(path: string, body?: unknown, requireWrite = false): Promise<T> {
    const response = await retryFetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: buildHeaders(requireWrite),
        body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
}

export async function put<T>(path: string, body?: unknown, requireWrite = false): Promise<T> {
    const response = await retryFetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: buildHeaders(requireWrite),
        body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
}

export async function postRaw(path: string, body: ArrayBuffer, contentType: string): Promise<void> {
    const response = await retryFetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
    })
    if (!response.ok) {
        const errBody = await response.json().catch(() => null)
        throw new ApiError(
            response.status,
            errBody,
            errBody?.error ?? `HTTP ${response.status}`,
            isRetryableStatus(response.status),
        )
    }
}

export async function del(path: string, requireWrite = false): Promise<void> {
    const response = await retryFetch(`${API_BASE}${path}`, {
        method: "DELETE",
        headers: requireWrite ? buildHeaders(true) : {},
    })
    if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new ApiError(
            response.status,
            body,
            body?.error ?? `HTTP ${response.status}`,
            isRetryableStatus(response.status),
        )
    }
}

export function getApiErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        switch (error.status) {
            case 404:
                return "Backend-Route nicht gefunden. Caddy-Konfiguration prüfen."
            case 403:
                return "Schreibzugriff verweigert. Write-Token prüfen."
            case 500:
                return "Server-Fehler. Container-Logs prüfen."
            case 0:
                return "Verbindung unterbrochen. Netzwerk oder Container prüfen."
            default:
                return `Unbekannter Fehler (${error.status})`
        }
    }
    if (error instanceof Error) {
        return error.message
    }
    return "Unbekannter Fehler"
}
