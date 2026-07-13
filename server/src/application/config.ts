import { z } from "zod"

const ConfigSchema = z.object({
    PORT: z.coerce.number().default(3001),
    ROTATION_DATA_DIR: z.string().default("/rotation-data/data"),
    ROTATION_MUSIC_PATH: z.string().min(1),
    ROTATION_WORKSPACE_PATH: z.string().min(1),
    ROTATION_SYNCTHING_ROOT: z.string().min(1),
    ROTATION_WRITE_TOKEN: z.string().min(1),
    ROTATION_BACKUP_ENABLED: z.enum(["true", "false"]).default("true"),
    ROTATION_BACKUP_CRON: z.string().default("0 3 * * *"),
    ROTATION_BACKUP_RETENTION_COUNT: z.coerce.number().min(1).default(7),
})

export type Config = z.infer<typeof ConfigSchema>

export function loadConfig(): Config {
    const parsed = ConfigSchema.safeParse(process.env)
    if (!parsed.success) {
        const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`)
        throw new Error(`Config validation failed:\n${issues.join("\n")}`)
    }
    return parsed.data
}
