import { afterEach, describe, expect, it } from "vitest"
import { loadConfig } from "./config.js"

const originalEnv = { ...process.env }

afterEach(() => {
    process.env = { ...originalEnv }
})

function setRequiredEnvironment(token: string): void {
    process.env.ROTATION_MUSIC_PATH = "/music"
    process.env.ROTATION_WORKSPACE_PATH = "/rotation-data"
    process.env.ROTATION_SYNCTHING_ROOT = "/rotation-data/exports/current-rotation"
    process.env.ROTATION_WRITE_TOKEN = token
}

describe("loadConfig", () => {
    it("accepts a non-blank production write token", () => {
        setRequiredEnvironment("secret-token")
        expect(loadConfig().ROTATION_WRITE_TOKEN).toBe("secret-token")
    })

    it("rejects a blank production write token with an actionable message", () => {
        setRequiredEnvironment("   ")
        expect(() => loadConfig()).toThrow(/ROTATION_WRITE_TOKEN: must be set to a non-blank secret/)
    })
})
