export function stringToHue(value: string): number {
    let hash = 0
    for (let i = 0; i < value.length; i++) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash % 360)
}

export function getInitials(title: string): string {
    return title
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase()
}
