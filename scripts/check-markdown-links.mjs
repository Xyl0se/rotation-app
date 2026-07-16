import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

const root = process.cwd()
const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage"])

function markdownFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        if (entry.isDirectory()) {
            return ignoredDirectories.has(entry.name)
                ? []
                : markdownFiles(join(directory, entry.name))
        }
        return entry.name.endsWith(".md") ? [join(directory, entry.name)] : []
    })
}

const failures = []
const markdownLink = /\[[^\]]*\]\(([^)]+)\)/g

for (const file of markdownFiles(root)) {
    const source = readFileSync(file, "utf8")
    for (const match of source.matchAll(markdownLink)) {
        const rawTarget = match[1].trim().replace(/^<|>$/g, "")
        if (!rawTarget || rawTarget.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(rawTarget)) {
            continue
        }

        const pathPart = decodeURIComponent(rawTarget.split("#", 1)[0].split("?", 1)[0])
        if (!pathPart) continue

        const target = resolve(dirname(file), pathPart)
        if (!existsSync(target)) {
            const line = source.slice(0, match.index).split("\n").length
            failures.push(`${file.slice(root.length + 1)}:${line} -> ${rawTarget}`)
        }
    }
}

if (failures.length > 0) {
    console.error("Broken local Markdown links:\n" + failures.map(item => `- ${item}`).join("\n"))
    process.exitCode = 1
} else {
    console.log("All local Markdown links resolve.")
}
