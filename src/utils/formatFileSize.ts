export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B"
    const units = ["B", "KB", "MB", "GB"]
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const unit = units[Math.min(i, units.length - 1)] ?? "B"
    const value = bytes / Math.pow(k, i)
    return `${value.toFixed(1)} ${unit}`
}
