import { z } from "zod"
import type { Response } from "express"

export const UUIDSchema = z.string().uuid()
export const BindingIdSchema = z.string().trim().min(1).max(1024).refine(
    (value) => !value.includes("\0"),
    "Binding ID must not contain null bytes",
)

const RoleSchema = z.enum(["new", "growing", "comfort-food", "classic", "admire", "archive"])
const IsoDateSchema = z.string().datetime({ offset: true })

const RoleHistoryEntrySchema = z.object({
    role: RoleSchema,
    recordedAt: IsoDateSchema,
    source: z.enum(["coach", "reflection", "archive"]),
})

const CoverOverrideSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("custom"),
        source: z.enum(["upload", "alternative"]),
        albumId: UUIDSchema,
        blobUrl: z.string().min(1).max(4096),
        fetchedAt: IsoDateSchema,
    }),
    z.object({
        type: z.literal("url"),
        albumId: UUIDSchema,
        url: z.string().url().max(4096),
        fetchedAt: IsoDateSchema,
    }),
])

const AlbumStorySchema = z.object({
    acquiredBecause: z.enum([
        "artist", "friend-recommendation", "specific-song", "concert", "review",
        "record-store", "gift", "random-discovery", "life-phase", "other",
    ]).optional(),
    lifePhase: z.enum([
        "childhood", "school", "studies", "first-apartment", "relationship",
        "breakup", "work", "travel", "family", "current", "other",
    ]).optional(),
    memoryNote: z.string().max(10_000).optional(),
    createdAt: IsoDateSchema,
    updatedAt: IsoDateSchema,
})

const AlbumBaseSchema = z.object({
    id: UUIDSchema,
    title: z.string().trim().min(1).max(500),
    artist: z.string().trim().min(1).max(500),
    year: z.string().trim().max(20).default(""),
    coverUrl: z.string().url().max(4096).optional(),
    coverOverride: CoverOverrideSchema.optional(),
    category: RoleSchema.optional(),
    roleHistory: z.array(RoleHistoryEntrySchema).max(10_000).default([]),
    listenCount: z.number().int().nonnegative().default(0),
    lastListened: IsoDateSchema.nullable().default(null),
    story: AlbumStorySchema.optional(),
})

export const AlbumSchema = AlbumBaseSchema.superRefine((album, context) => {
    if (album.coverOverride && album.coverOverride.albumId !== album.id) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["coverOverride", "albumId"],
            message: "Cover override albumId must match album id",
        })
    }
})

export const CreateAlbumSchema = AlbumSchema
export const UpdateAlbumSchema = AlbumBaseSchema.partial().omit({ id: true })
export const ImportAlbumsSchema = z.object({
    albums: z.array(AlbumSchema).max(10_000),
}).superRefine(({ albums }, context) => {
    const seen = new Set<string>()
    albums.forEach((album, index) => {
        if (seen.has(album.id)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["albums", index, "id"],
                message: "Duplicate album ID in import",
            })
        }
        seen.add(album.id)
    })
})

export const BindingAlbumIdBodySchema = z.object({ albumId: BindingIdSchema })
export const LinkBindingBodySchema = z.object({
    albumId: BindingIdSchema,
    libraryAlbumId: UUIDSchema,
})
export const CaptureBindingBodySchema = z.object({
    albumId: BindingIdSchema,
    album: AlbumSchema,
})
export const DeleteBindingQuerySchema = z.object({ albumId: BindingIdSchema })
export const SelectBindingCandidateSchema = z.object({
    libraryAlbumId: UUIDSchema,
    scanId: UUIDSchema,
})

const AlbumIdsSchema = z.array(UUIDSchema).max(1_000).superRefine((ids, context) => {
    if (new Set(ids).size !== ids.length) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "albumIds must be unique" })
    }
})
export const ExportAlbumIdsSchema = z.object({ albumIds: AlbumIdsSchema })
export const StageExportSchema = z.object({ exportId: UUIDSchema, albumIds: AlbumIdsSchema })
export const ApplyExportSchema = z.object({ exportId: UUIDSchema })
export const CoverAlbumIdSchema = z.object({ albumId: UUIDSchema })

const RotationRoleSchema = z.enum(["new", "growing", "comfort-food"])
const RotationItemSchema = z.object({ albumId: UUIDSchema, role: RotationRoleSchema, reason: z.enum(["quota", "fill"]) })
const RotationQuotaSchema = z.object({ role: RotationRoleSchema, targetCount: z.number().int().nonnegative() })
export const RotationPlanSchema = z.object({
    id: UUIDSchema,
    name: z.string().trim().min(1).max(200),
    targetSize: z.number().int().positive().max(1_000),
    items: z.array(RotationItemSchema).max(1_000),
    albumIds: z.array(UUIDSchema).max(1_000),
    roleQuotas: z.array(RotationQuotaSchema).max(20),
    createdAt: IsoDateSchema,
    status: z.enum(["draft", "active"]),
    acceptedAt: IsoDateSchema.optional(),
    focusAlbumId: UUIDSchema.nullable().default(null),
}).superRefine((plan, context) => {
    const itemIds = plan.items.map(item => item.albumId)
    if (new Set(itemIds).size !== itemIds.length || itemIds.join("|") !== plan.albumIds.join("|")) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["albumIds"], message: "albumIds must match unique items" })
    }
    if (plan.focusAlbumId && (plan.status !== "active" || !itemIds.includes(plan.focusAlbumId))) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["focusAlbumId"], message: "Focus must belong to active Rotation" })
    }
})
export const FocusAlbumSchema = z.object({ albumId: UUIDSchema.nullable() })
export const ListenEventSchema = z.object({ id: UUIDSchema, albumId: UUIDSchema, listenedAt: IsoDateSchema })
export const RotationLegacyImportSchema = z.object({
    draft: RotationPlanSchema.nullable().optional(),
    active: RotationPlanSchema.nullable().optional(),
    listenEvents: z.array(ListenEventSchema).max(100_000).default([]),
})

export function parseRequest<T>(
    schema: z.ZodType<T>,
    input: unknown,
    res: Response,
): T | null {
    const parsed = schema.safeParse(input)
    if (parsed.success) return parsed.data
    res.status(400).json({
        code: "VALIDATION_ERROR",
        error: "Invalid request",
        issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
        })),
    })
    return null
}
