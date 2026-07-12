import express from "express"
import helmet from "helmet"
import cors from "cors"

import { loadConfig } from "./application/config.js"
import { initDatabase } from "./infrastructure/persistence/sqlite/connection.js"
import { createBindingRepository } from "./infrastructure/persistence/sqlite/bindingRepository.js"
import { createExportOperationRepository } from "./infrastructure/persistence/sqlite/exportOperationRepository.js"
import { createExportLockRepository } from "./infrastructure/persistence/sqlite/exportLockRepository.js"
import { createScanRunRepository } from "./infrastructure/persistence/sqlite/scanRunRepository.js"
import { createPathGuard } from "./infrastructure/filesystem/pathGuard.js"
import { createDirectoryScanner } from "./infrastructure/filesystem/directoryScanner.js"
import { createScanService } from "./application/scanService.js"
import { createExportService } from "./application/exportService.js"
import { runCrashRecovery } from "./application/crashRecovery.js"

import { healthRouter } from "./routes/health.js"
import { createConfigRouter } from "./routes/config.js"
import { createScanRouter } from "./routes/scan.js"
import { createBindingsRouter } from "./routes/bindings.js"
import { createExportsRouter } from "./routes/exports.js"
import { createRequireWriteToken } from "./routes/middleware/writeToken.js"

const config = loadConfig()
const db = initDatabase()

const bindingRepo = createBindingRepository(db)
const exportRepo = createExportOperationRepository(db)
const scanRunRepo = createScanRunRepository(db)

const musicGuard = createPathGuard(config.ROTATION_MUSIC_PATH)
const workspaceGuard = createPathGuard(config.ROTATION_WORKSPACE_PATH)
const syncthingGuard = createPathGuard(config.ROTATION_SYNCTHING_ROOT)

const scanner = createDirectoryScanner(musicGuard)
const scanService = createScanService(scanner, bindingRepo, scanRunRepo)
const lockRepo = createExportLockRepository(db)
const exportService = createExportService(bindingRepo, exportRepo, lockRepo, musicGuard, workspaceGuard)

// Run crash recovery on startup
const recovery = runCrashRecovery(exportRepo, lockRepo, workspaceGuard)
if (recovery.recovered > 0 || recovery.cleanedStagingDirs.length > 0 || recovery.cleanedArchives.length > 0) {
    console.log("Crash recovery completed:", recovery)
}

const requireWriteToken = createRequireWriteToken(config.ROTATION_WRITE_TOKEN)

const app = express()

app.use(helmet())
app.use(cors({ origin: true }))
app.use(express.json())

app.use("/health", healthRouter)
app.use("/config", createConfigRouter(config))
app.use("/scan", requireWriteToken, createScanRouter(scanService, scanRunRepo, bindingRepo))

app.use("/bindings", createBindingsRouter(bindingRepo, musicGuard))
app.use("/exports", requireWriteToken, createExportsRouter(exportService))

app.use((_req, res) => {
    res.status(404).json({ error: "Not found" })
})

const port = config.PORT
app.listen(port, () => {
    console.log(`Rotation API listening on port ${port}`)
    console.log(`Music path: ${config.ROTATION_MUSIC_PATH}`)
    console.log(`Workspace path: ${config.ROTATION_WORKSPACE_PATH}`)
    console.log(`Syncthing root: ${config.ROTATION_SYNCTHING_ROOT}`)
})
