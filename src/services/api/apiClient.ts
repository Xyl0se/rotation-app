/**
 * Low-level API client for the Rotation backend.
 * All calls are relative to /api (proxied by Vite dev server).
 */

import { retryFetch } from "./retryFetch.js"

const API_BASE = "/api"

export async function probeApi(signal?: AbortSignal): Promise<boolean> {
    const response = await fetch(`${API_BASE}/health`, {
        method: "GET",
        cache: "no-store",
        signal,
    })
    return response.status > 0
}

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

function buildHeaders(): Record<string, string> {
    return {
        "Content-Type": "application/json",
    }
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

export async function post<T>(path: string, body?: unknown): Promise<T> {
    const response = await retryFetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
}

export async function put<T>(path: string, body?: unknown): Promise<T> {
    const response = await retryFetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
}

export async function postRaw(
    path: string,
    body: ArrayBuffer,
    contentType: string,
): Promise<void> {
    const headers = buildHeaders()
    headers["Content-Type"] = contentType
    const response = await retryFetch(`${API_BASE}${path}`, {
        method: "POST",
        headers,
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

export async function del(path: string): Promise<void> {
    const response = await retryFetch(`${API_BASE}${path}`, {
        method: "DELETE",
        headers: buildHeaders(),
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
        const body = error.body as { code?: string; error?: string; diagnostic?: { reason?: string } } | null
        if (body?.code === "CROSS_SITE_MUTATION") {
            return body.error ?? `Schreibzugriff durch Sicherheitsprüfung abgelehnt (${body.diagnostic?.reason ?? "unknown"}).`
        }
        if (body?.code === "INVALID_WRITE_TOKEN") {
            return "Interne Proxy-Authentifizierung fehlgeschlagen. ROTATION_WRITE_TOKEN in Web- und API-Container vergleichen."
        }
        switch (error.status) {
            case 404:
                return "Backend-Route nicht gefunden. Caddy-Konfiguration prüfen."
            case 403:
                return body?.error ?? "Schreibzugriff wurde vom Server verweigert."
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
