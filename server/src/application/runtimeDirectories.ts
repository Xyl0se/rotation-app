import { accessSync, constants, mkdirSync } from "node:fs"
import { join } from "node:path"

export interface RuntimeDirectoryConfig {
    dataDir: string
    workspacePath: string
    syncthingRoot: string
}

export function prepareRuntimeDirectories(config: RuntimeDirectoryConfig): void {
    const directories = [
        config.dataDir,
        join(config.dataDir, "backups"),
        join(config.dataDir, "covers"),
        config.workspacePath,
        join(config.workspacePath, "staging-exports"),
        join(config.workspacePath, "exports"),
        join(config.workspacePath, "exports", "archive"),
        config.syncthingRoot,
    ]

    for (const directory of new Set(directories)) {
        try {
            mkdirSync(directory, { recursive: true })
            accessSync(directory, constants.R_OK | constants.W_OK)
        } catch (error) {
            throw new Error(
                `Rotation runtime directory is not readable and writable: ${directory}. ` +
                "Set host ownership to 1026:100 before starting the container.",
                { cause: error },
            )
        }
    }
}
