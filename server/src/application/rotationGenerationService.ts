import { randomUUID } from "node:crypto"
import { createLogger } from "../infrastructure/logger/logger.js"
import type { AlbumRepository } from "../infrastructure/persistence/sqlite/albumRepository.js"
import type { RotationStateRepository } from "../infrastructure/persistence/sqlite/rotationStateRepository.js"
import { generateRotationPlan } from "@rotation/domain"
import { toRotationCandidate } from "../adapters/rotationDomain.js"
import type { RotationPlan } from "../domain/rotationTypes.js"

const log = createLogger("rotation-generation-service")

export interface RotationGenerationService {
    generateRotation(options?: GenerateRotationOptions): RotationPlan
    activateRotation(plan: RotationPlan): RotationPlan
}

export interface GenerateRotationOptions {
    executionKey?: string | null
    random?: () => number
    generateId?: () => string
}

export function createRotationGenerationService(
    albumRepo: AlbumRepository,
    rotationRepo: RotationStateRepository,
): RotationGenerationService {
    return {
        generateRotation(options: GenerateRotationOptions = {}): RotationPlan {
            // 1. Fetch all albums and map to rotation candidates
            const allAlbums = albumRepo.findAll(10_000, 0)
            const candidates = allAlbums.map(toRotationCandidate).filter((c): c is NonNullable<typeof c> => c !== null)

            if (candidates.length === 0) {
                throw new Error("NO_ELIGIBLE_ALBUMS")
            }

            // 2. Fetch rotation settings
            const settings = rotationRepo.findSettings()

            // 3. Get previous album IDs for continuity weighting
            const active = rotationRepo.findActive()
            const previousAlbumIds = active?.albumIds ?? []

            // 4. Generate rotation plan via shared domain
            const sharedPlan = generateRotationPlan(candidates, {
                targetSize: settings.targetSize,
                roleQuotas: settings.roleQuotas,
                previousAlbumIds,
            }, {
                random: options.random ?? Math.random,
                generateId: options.generateId ?? randomUUID,
            })

            // 5. Augment with server-specific persistence fields
            const plan: RotationPlan = {
                ...sharedPlan,
                focusAlbumId: null,
                generationSource: options.executionKey ? "automation" : "manual",
                automationExecutionKey: options.executionKey ?? null,
            }

            log.info("Rotation generated", {
                planId: plan.id,
                albumCount: plan.items.length,
                generationSource: plan.generationSource,
                executionKey: plan.automationExecutionKey,
            })

            return plan
        },

        activateRotation(plan: RotationPlan): RotationPlan {
            const activatedPlan: RotationPlan = {
                ...plan,
                status: "active",
                acceptedAt: new Date().toISOString(),
                focusAlbumId: null,
            }

            rotationRepo.savePlan(activatedPlan)

            log.info("Rotation activated", {
                planId: activatedPlan.id,
                previousRotationId: rotationRepo.findActive()?.id === activatedPlan.id ? undefined : rotationRepo.findActive()?.id,
            })

            return activatedPlan
        },
    }
}
