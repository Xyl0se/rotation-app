import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { type LogLevel, type LogFormat } from "./logger.js"

describe("logger", () => {
    let stdoutLines: string[] = []
    let stderrLines: string[] = []
    let originalStdoutWrite: typeof process.stdout.write
    let originalStderrWrite: typeof process.stderr.write
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        originalEnv = { ...process.env }
        originalStdoutWrite = process.stdout.write.bind(process.stdout)
        originalStderrWrite = process.stderr.write.bind(process.stderr)
        stdoutLines = []
        stderrLines = []

        process.stdout.write = (chunk: string | Uint8Array) => {
            stdoutLines.push(chunk.toString().trim())
            return true
        }
        process.stderr.write = (chunk: string | Uint8Array) => {
            stderrLines.push(chunk.toString().trim())
            return true
        }
    })

    afterEach(() => {
        process.env = originalEnv
        process.stdout.write = originalStdoutWrite
        process.stderr.write = originalStderrWrite
    })

    function setEnv(level: LogLevel, format: LogFormat) {
        process.env.ROTATION_LOG_LEVEL = level
        process.env.ROTATION_LOG_FORMAT = format
    }

    it("formats pretty output by default", async () => {
        setEnv("info", "pretty")
        // Re-import to pick up env
        const { createLogger: create } = await import("./logger.js")
        const log = create("test")
        log.info("hello")
        expect(stdoutLines[0]).toMatch(/\[\d{2}:\d{2}:\d{2}\.\d{3}\] INFO {2}\[test\] hello/)
    })

    it("formats json output when configured", async () => {
        setEnv("info", "json")
        const { createLogger: create } = await import("./logger.js")
        const log = create("test")
        log.info("hello")
        const parsed = JSON.parse(stdoutLines[0])
        expect(parsed.level).toBe("info")
        expect(parsed.namespace).toBe("test")
        expect(parsed.message).toBe("hello")
        expect(parsed.time).toBeDefined()
    })

    it("respects log level filtering", async () => {
        setEnv("warn", "pretty")
        const { createLogger: create } = await import("./logger.js")
        const log = create("test")
        log.debug("debug-msg")
        log.info("info-msg")
        log.warn("warn-msg")
        log.error("error-msg")
        expect(stdoutLines).toHaveLength(1)
        expect(stdoutLines[0]).toContain("warn-msg")
        expect(stderrLines).toHaveLength(1)
        expect(stderrLines[0]).toContain("error-msg")
    })

    it("sanitizes paths in context", async () => {
        process.env.ROTATION_MUSIC_PATH = "/music"
        setEnv("info", "json")
        const { createLogger: create } = await import("./logger.js")
        const log = create("test")
        log.info("scan", { sourcePath: "/music/Pink Floyd/Dark Side" })
        const parsed = JSON.parse(stdoutLines[0])
        expect(parsed.context.sourcePath).toBe("/Pink Floyd/Dark Side")
    })

    it("redacts tokens in context", async () => {
        setEnv("info", "json")
        const { createLogger: create } = await import("./logger.js")
        const log = create("test")
        log.info("request", { writeToken: "secret123" })
        const parsed = JSON.parse(stdoutLines[0])
        expect(parsed.context.writeToken).toBe("[redacted]")
    })

    it("writes errors to stderr", async () => {
        setEnv("info", "pretty")
        const { createLogger: create } = await import("./logger.js")
        const log = create("test")
        log.error("boom", { id: "x" }, new Error("fail"))
        expect(stderrLines).toHaveLength(1)
        expect(stderrLines[0]).toContain("boom")
        expect(stderrLines[0]).toContain("fail")
    })

    it("includes context in pretty format", async () => {
        setEnv("info", "pretty")
        const { createLogger: create } = await import("./logger.js")
        const log = create("test")
        log.info("done", { count: 5 })
        expect(stdoutLines[0]).toContain('"count":5')
    })
})
