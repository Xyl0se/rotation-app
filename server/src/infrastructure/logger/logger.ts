export type LogLevel = "debug" | "info" | "warn" | "error"
export type LogFormat = "pretty" | "json"

interface LogEntry {
    time: string
    level: LogLevel
    namespace: string
    message: string
    context?: Record<string, unknown>
    error?: unknown
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
}

function getEnvLevel(): LogLevel {
    const env = process.env.ROTATION_LOG_LEVEL?.toLowerCase()
    if (env === "debug" || env === "info" || env === "warn" || env === "error") {
        return env
    }
    return "info"
}

function getEnvFormat(): LogFormat {
    const env = process.env.ROTATION_LOG_FORMAT?.toLowerCase()
    if (env === "json") return "json"
    return "pretty"
}

function sanitizePath(path: string): string {
    // Container roots are safe and useful operational context. Represent configured
    // host paths by explicit labels instead of collapsing an exact root to "/".
    const roots = [
        { path: process.env.ROTATION_SYNCTHING_ROOT, label: "[syncthing-root]" },
        { path: process.env.ROTATION_WORKSPACE_PATH, label: "[workspace-root]" },
        { path: process.env.ROTATION_MUSIC_PATH ?? "/music", label: "[music-root]" },
        { path: process.env.ROTATION_DATA_DIR ?? "/rotation-data", label: "[data-root]" },
    ]
        .filter((root): root is { path: string; label: string } => Boolean(root.path))
        .sort((a, b) => b.path.length - a.path.length)

    for (const root of roots) {
        if (path === root.path) return root.label
        if (path.startsWith(`${root.path}/`)) {
            return `${root.label}${path.slice(root.path.length)}`
        }
    }
    return path
}

function sanitizeContextValue(key: string, value: unknown): unknown {
    if (typeof value === "string") {
        const lowerKey = key.toLowerCase()
        if (lowerKey.includes("path") || lowerKey.includes("dir") || lowerKey.includes("file")) {
            return sanitizePath(value)
        }
        if (lowerKey.includes("token") || lowerKey.includes("password") || lowerKey.includes("secret")) {
            return "[redacted]"
        }
    }
    if (Array.isArray(value)) {
        return value.map((v, i) => sanitizeContextValue(String(i), v))
    }
    if (value && typeof value === "object") {
        const sanitized: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(value)) {
            sanitized[k] = sanitizeContextValue(k, v)
        }
        return sanitized
    }
    return value
}

function buildEntry(level: LogLevel, namespace: string, message: string, context?: Record<string, unknown>, error?: unknown): LogEntry {
    return {
        time: new Date().toISOString(),
        level,
        namespace,
        message,
        context: context ? sanitizeContextValue("context", context) as Record<string, unknown> : undefined,
        error: error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : error,
    }
}

function formatPretty(entry: LogEntry): string {
    const time = entry.time.split("T")[1]?.replace("Z", "") ?? entry.time
    const ctx = entry.context ? " " + JSON.stringify(entry.context) : ""
    const err = entry.error ? ` [error: ${JSON.stringify(entry.error)}]` : ""
    return `[${time}] ${entry.level.toUpperCase().padEnd(5)} [${entry.namespace}] ${entry.message}${ctx}${err}`
}

function formatJson(entry: LogEntry): string {
    return JSON.stringify(entry)
}

export interface Logger {
    debug(message: string, context?: Record<string, unknown>): void
    info(message: string, context?: Record<string, unknown>): void
    warn(message: string, context?: Record<string, unknown>, error?: unknown): void
    error(message: string, context?: Record<string, unknown>, error?: unknown): void
}

export function createLogger(namespace: string): Logger {
    const level = getEnvLevel()
    const format = getEnvFormat()

    function shouldLog(l: LogLevel): boolean {
        return LEVEL_PRIORITY[l] >= LEVEL_PRIORITY[level]
    }

    function write(l: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown): void {
        if (!shouldLog(l)) return
        const entry = buildEntry(l, namespace, message, context, error)
        const line = format === "json" ? formatJson(entry) : formatPretty(entry)
        const stream = l === "error" ? process.stderr : process.stdout
        stream.write(line + "\n")
    }

    return {
        debug: (message, context) => write("debug", message, context),
        info: (message, context) => write("info", message, context),
        warn: (message, context, error) => write("warn", message, context, error),
        error: (message, context, error) => write("error", message, context, error),
    }
}
