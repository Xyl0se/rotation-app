export type RetryReporter = {
    onRetrying: (requestId: number, attempt: number, max: number) => void
    onOnline: (requestId: number) => void
    onOffline: (requestId: number) => void
    onError: (requestId: number, message: string) => void
}

let globalReporter: RetryReporter | null = null

export function setRetryReporter(reporter: RetryReporter | null): void {
    globalReporter = reporter
}

const DEFAULT_TIMEOUT_MS = 10000
const MAX_RETRIES = 3
const BACKOFF_DELAYS_MS = [1000, 2000, 4000]
let nextRequestId = 1

function isRetryable(error: unknown, status?: number): boolean {
    if (typeof status === "number") {
        if (status >= 400 && status < 500) return false
        if (status >= 500) return true
    }

    if (error instanceof DOMException && error.name === "AbortError") return true
    if (error instanceof TypeError) return true

    return false
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function retryFetch(
    input: RequestInfo,
    init?: RequestInit,
): Promise<Response> {
    const requestId = nextRequestId++
    let lastError: unknown = null

    if (!navigator.onLine) {
        const message = "Offline. No network connection."
        globalReporter?.onOffline(requestId)
        globalReporter?.onError(requestId, message)
        throw new Error(message)
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

        try {
            const response = await fetch(input, {
                ...init,
                signal: controller.signal,
            })
            clearTimeout(timeoutId)

            if (response.ok || (response.status >= 400 && response.status < 500)) {
                globalReporter?.onOnline(requestId)
                return response
            }

            if (!isRetryable(null, response.status)) {
                return response
            }

            if (attempt < MAX_RETRIES) {
                globalReporter?.onRetrying(requestId, attempt + 1, MAX_RETRIES)
                await sleep(BACKOFF_DELAYS_MS[attempt])
            }
        } catch (error) {
            clearTimeout(timeoutId)
            lastError = error

            if (!navigator.onLine) {
                globalReporter?.onOffline(requestId)
                globalReporter?.onError(requestId, "Offline. No network connection.")
                throw error
            }

            if (!isRetryable(error)) {
                throw error
            }

            if (attempt < MAX_RETRIES) {
                globalReporter?.onRetrying(requestId, attempt + 1, MAX_RETRIES)
                await sleep(BACKOFF_DELAYS_MS[attempt])
            }
        }
    }

    globalReporter?.onError(
        requestId,
        lastError instanceof Error
            ? lastError.message
            : `Request failed after ${MAX_RETRIES} retries`,
    )
    throw lastError ?? new Error(`Request failed after ${MAX_RETRIES} retries`)
}
