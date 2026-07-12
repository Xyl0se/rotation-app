/**
 * Low-level API client for the Rotation backend.
 * All calls are relative to /api (proxied by Vite dev server).
 */

const API_BASE = "/api"

export class ApiError extends Error {
    status: number
    body: unknown

    constructor(status: number, body: unknown, message: string) {
        super(message)
        this.name = "ApiError"
        this.status = status
        this.body = body
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new ApiError(
            response.status,
            body,
            body?.error ?? `HTTP ${response.status}`,
        )
    }
    return response.json() as Promise<T>
}

export async function get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`)
    return handleResponse<T>(response)
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
}

export async function del(path: string): Promise<void> {
    const response = await fetch(`${API_BASE}${path}`, {
        method: "DELETE",
    })
    if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new ApiError(
            response.status,
            body,
            body?.error ?? `HTTP ${response.status}`,
        )
    }
}
