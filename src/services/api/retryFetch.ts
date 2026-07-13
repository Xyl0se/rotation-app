export type RetryReporter = {
    onRetrying: (attempt: number, max: number) => void
    onOnline: () => void
    onOffline: () => void
    onError: (message: string) => void
}

let globalReporter: RetryReporter | null = null

export function setRetryReporter(reporter: RetryReporter | null): void {
    globalReporter = reporter
}

const DEFAULT_TIMEOUT_MS = 10000
const MAX_RETRIES = 3
const BACKOFF_DELAYS_MS = [1000, 2000, 4000]

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
    let lastError: unknown = null

    if (!navigator.onLine) {
        const message = "Offline. No network connection."
        globalReporter?.onOffline()
        globalReporter?.onError(message)
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
                globalReporter?.onOnline()
                return response
            }

            if (!isRetryable(null, response.status)) {
                return response
            }

            if (attempt < MAX_RETRIES) {
                globalReporter?.onRetrying(attempt + 1, MAX_RETRIES)
                await sleep(BACKOFF_DELAYS_MS[attempt])
            }
        } catch (error) {
            clearTimeout(timeoutId)
            lastError = error

            if (!navigator.onLine) {
                globalReporter?.onOffline()
                globalReporter?.onError("Offline. No network connection.")
                throw error
            }

            if (!isRetryable(error)) {
                throw error
            }

            if (attempt < MAX_RETRIES) {
                globalReporter?.onRetrying(attempt + 1, MAX_RETRIES)
                await sleep(BACKOFF_DELAYS_MS[attempt])
            }
        }
    }

    globalReporter?.onError(
        lastError instanceof Error
            ? lastError.message
            : `Request failed after ${MAX_RETRIES} retries`,
    )
    throw lastError ?? new Error(`Request failed after ${MAX_RETRIES} retries`)
}
