const STORAGE_KEY = "rotation_write_token"

export function getWriteToken(): string | null {
    return localStorage.getItem(STORAGE_KEY)
}

export function setWriteToken(token: string): void {
    localStorage.setItem(STORAGE_KEY, token)
}

export function clearWriteToken(): void {
    localStorage.removeItem(STORAGE_KEY)
}
