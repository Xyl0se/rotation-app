import { describe, expect, it } from "vitest"

import type { Album } from "../../types/album"
import type { RotationPlanItem } from "../rotation-plan/rotationPlan"
import type { ListenEvent } from "../listening/listenEvents"

import { explainRotationItem } from "./explainRotationItem"

function makeAlbum(overrides: Partial<Album> = {}): Album {
    return {
        id: "album-1",
        title: "Test Album",
        artist: "Test Artist",
        year: "2024",
        roleHistory: [
            {
                role: "new",
                recordedAt: "2024-01-01T00:00:00Z",
                source: "coach",
            },
        ],
        listenCount: 0,
        lastListened: null,
        ...overrides,
    }
}

function makeItem(overrides: Partial<RotationPlanItem> = {}): RotationPlanItem {
    return {
        albumId: "album-1",
        role: "new",
        reason: "quota",
        ...overrides,
    }
}

const now = new Date("2024-06-15T00:00:00Z")

describe("explainRotationItem", () => {
    describe("Rollen-Erklärung", () => {
        it("erklärt ein 'new'-Album", () => {
            const album = makeAlbum({
                category: "new",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
            })
            const item = makeItem({ role: "new" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Dieses Album ist neu in deiner Sammlung und wartet darauf, entdeckt zu werden.",
            )
            expect(explanation.source).toBe("role")
        })

        it("erklärt ein 'growing'-Album", () => {
            const album = makeAlbum({
                category: "growing",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
            })
            const item = makeItem({ role: "growing" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Dieses Album wächst mit jedem Hören ein Stück mehr.",
            )
            expect(explanation.source).toBe("role")
        })

        it("erklärt ein 'comfort-food'-Album", () => {
            const album = makeAlbum({
                category: "comfort-food",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
            })
            const item = makeItem({ role: "comfort-food" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Dieses Album bringt Vertrautheit in die aktuelle Auswahl.",
            )
            expect(explanation.source).toBe("role")
        })

        it("erklärt ein 'classic'-Album", () => {
            const album = makeAlbum({
                category: "classic",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
            })
            const item = makeItem({ role: "classic" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Dieses Album begleitet dich schon lange und bildet einen ruhigen Mittelpunkt.",
            )
            expect(explanation.source).toBe("role")
        })

        it("erklärt ein 'admire'-Album", () => {
            const album = makeAlbum({
                category: "admire",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
            })
            const item = makeItem({ role: "admire" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Dieses Album schätzt du – auch wenn du nicht oft dazu greifst.",
            )
            expect(explanation.source).toBe("role")
        })
    })

    describe("Hörhistorie-Erklärung", () => {
        it("erwähnt fehlende Hörsession, wenn noch nie gehört", () => {
            const album = makeAlbum({
                category: "new",
                listenCount: 0,
                lastListened: null,
            })
            const item = makeItem({ role: "new" })
            const events: ListenEvent[] = []
            const explanation = explainRotationItem(album, item, events, now)

            expect(explanation.text).toBe(
                "Es wartet auf seine erste Hörsession.",
            )
            expect(explanation.source).toBe("listen-history")
        })

        it("erwähnt fehlende Hörsession primär über listenEvents", () => {
            const album = makeAlbum({
                category: "new",
                listenCount: 5,
                lastListened: "2024-06-01T00:00:00Z",
            })
            const item = makeItem({ role: "new" })
            const events: ListenEvent[] = []
            const explanation = explainRotationItem(album, item, events, now)

            expect(explanation.source).toBe("listen-history")
        })

        it("erwähnt lange nicht gehört, wenn lastListened alt", () => {
            const album = makeAlbum({
                category: "comfort-food",
                listenCount: 3,
                lastListened: "2024-01-01T00:00:00Z",
            })
            const item = makeItem({ role: "comfort-food" })
            const events: ListenEvent[] = []
            const explanation = explainRotationItem(album, item, events, now)

            expect(explanation.text).toBe(
                "Es wurde schon eine Weile nicht mehr gehört.",
            )
            expect(explanation.source).toBe("listen-history")
        })

        it("nutzt listenEvents primär für lange nicht gehört", () => {
            const album = makeAlbum({
                category: "comfort-food",
                listenCount: 0,
                lastListened: null,
            })
            const item = makeItem({ role: "comfort-food" })
            const events: ListenEvent[] = [
                {
                    id: "event-1",
                    albumId: "album-1",
                    listenedAt: "2024-01-01T00:00:00Z",
                },
            ]
            const explanation = explainRotationItem(album, item, events, now)

            expect(explanation.text).toBe(
                "Es wurde schon eine Weile nicht mehr gehört.",
            )
            expect(explanation.source).toBe("listen-history")
        })

        it("erwähnt häufiges Hören, wenn count >= 5 und kürzlich gehört", () => {
            const album = makeAlbum({
                category: "growing",
                listenCount: 0,
                lastListened: null,
            })
            const item = makeItem({ role: "growing" })
            const events: ListenEvent[] = Array.from({ length: 5 }, (_, i) => ({
                id: `event-${i}`,
                albumId: "album-1",
                listenedAt: `2024-06-0${5 - i}T00:00:00Z`,
            }))
            const explanation = explainRotationItem(album, item, events, now)

            expect(explanation.text).toBe(
                "Du hast es in letzter Zeit oft gehört.",
            )
            expect(explanation.source).toBe("listen-history")
        })
    })

    describe("Rollenverlauf-Erklärung", () => {
        it("erwähnt kurze Rolle, wenn roleHistory jünger als 14 Tage", () => {
            const album = makeAlbum({
                category: "new",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "new",
                        recordedAt: "2024-06-10T00:00:00Z",
                        source: "coach",
                    },
                ],
            })
            const item = makeItem({ role: "new" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Es ist erst seit Kurzem Teil dieser Rolle.",
            )
            expect(explanation.source).toBe("role-history")
        })

        it("erwähnt lange Rolle, wenn roleHistory älter als 180 Tage", () => {
            const album = makeAlbum({
                category: "classic",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "classic",
                        recordedAt: "2023-01-01T00:00:00Z",
                        source: "coach",
                    },
                ],
            })
            const item = makeItem({ role: "classic" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Es gehört schon lange zu dieser Rolle.",
            )
            expect(explanation.source).toBe("role-history")
        })
    })

    describe("Plan-Grund-Erklärung", () => {
        it("erwähnt fill-Grund, wenn reason = 'fill' und keine andere Erklärung zutrifft", () => {
            const album = makeAlbum({
                category: "archive",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "archive",
                        recordedAt: "2024-03-01T00:00:00Z",
                        source: "archive",
                    },
                ],
            })
            const item = makeItem({ role: "archive", reason: "fill" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Es ergänzt die aktuelle Auswahl.",
            )
            expect(explanation.source).toBe("plan-reason")
        })
    })

    describe("Story-Erklärung", () => {
        it("berücksichtigt Story: friend-recommendation", () => {
            const album = makeAlbum({
                category: "archive",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "archive",
                        recordedAt: "2024-03-01T00:00:00Z",
                        source: "archive",
                    },
                ],
                story: {
                    acquiredBecause: "friend-recommendation",
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z",
                },
            })
            const item = makeItem({ role: "archive" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Es kam ursprünglich durch eine Empfehlung in deine Sammlung.",
            )
            expect(explanation.source).toBe("story")
        })

        it("berücksichtigt Story: concert", () => {
            const album = makeAlbum({
                category: "archive",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "archive",
                        recordedAt: "2024-03-01T00:00:00Z",
                        source: "archive",
                    },
                ],
                story: {
                    acquiredBecause: "concert",
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z",
                },
            })
            const item = makeItem({ role: "archive" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Es ist mit einem Konzert verbunden.",
            )
            expect(explanation.source).toBe("story")
        })

        it("berücksichtigt Story: gift", () => {
            const album = makeAlbum({
                category: "archive",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "archive",
                        recordedAt: "2024-03-01T00:00:00Z",
                        source: "archive",
                    },
                ],
                story: {
                    acquiredBecause: "gift",
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z",
                },
            })
            const item = makeItem({ role: "archive" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Es ist ein Geschenk, das in deiner Sammlung geblieben ist.",
            )
            expect(explanation.source).toBe("story")
        })

        it("berücksichtigt Story: lifePhase", () => {
            const album = makeAlbum({
                category: "archive",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "archive",
                        recordedAt: "2024-03-01T00:00:00Z",
                        source: "archive",
                    },
                ],
                story: {
                    lifePhase: "studies",
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z",
                },
            })
            const item = makeItem({ role: "archive" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Es ist mit einer bestimmten Lebensphase verbunden.",
            )
            expect(explanation.source).toBe("story")
        })

        it("berücksichtigt Story: memoryNote", () => {
            const album = makeAlbum({
                category: "archive",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "archive",
                        recordedAt: "2024-03-01T00:00:00Z",
                        source: "archive",
                    },
                ],
                story: {
                    memoryNote: "Hat mich durch den Winter begleitet.",
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z",
                },
            })
            const item = makeItem({ role: "archive" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Eine persönliche Erinnerung gehört dazu.",
            )
            expect(explanation.source).toBe("story")
        })
    })

    describe("Priorisierung", () => {
        it("priorisiert Listen-History vor Role-History", () => {
            const album = makeAlbum({
                category: "comfort-food",
                listenCount: 0,
                lastListened: null,
                roleHistory: [
                    {
                        role: "comfort-food",
                        recordedAt: "2024-06-10T00:00:00Z",
                        source: "coach",
                    },
                ],
            })
            const item = makeItem({ role: "comfort-food" })
            const events: ListenEvent[] = []
            const explanation = explainRotationItem(album, item, events, now)

            expect(explanation.source).toBe("listen-history")
            expect(explanation.text).toBe(
                "Es wartet auf seine erste Hörsession.",
            )
        })

        it("priorisiert Role-History vor Role", () => {
            const album = makeAlbum({
                category: "new",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "new",
                        recordedAt: "2024-06-10T00:00:00Z",
                        source: "coach",
                    },
                ],
            })
            const item = makeItem({ role: "new" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.source).toBe("role-history")
            expect(explanation.text).toBe(
                "Es ist erst seit Kurzem Teil dieser Rolle.",
            )
        })

        it("priorisiert Rolle vor Story", () => {
            const album = makeAlbum({
                category: "new",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "new",
                        recordedAt: "2024-03-01T00:00:00Z",
                        source: "coach",
                    },
                ],
                story: {
                    acquiredBecause: "gift",
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z",
                },
            })
            const item = makeItem({ role: "new" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.source).toBe("role")
        })

        it("priorisiert Story vor Plan-Reason", () => {
            const album = makeAlbum({
                category: "archive",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "archive",
                        recordedAt: "2024-03-01T00:00:00Z",
                        source: "archive",
                    },
                ],
                story: {
                    acquiredBecause: "gift",
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z",
                },
            })
            const item = makeItem({ role: "archive", reason: "fill" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.source).toBe("story")
        })
    })

    describe("Fallback", () => {
        it("gibt Fallback zurück, wenn nichts zutrifft", () => {
            const album = makeAlbum({
                category: "archive",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
                roleHistory: [
                    {
                        role: "archive",
                        recordedAt: "2024-03-01T00:00:00Z",
                        source: "archive",
                    },
                ],
            })
            const item = makeItem({ role: "archive", reason: "quota" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "Dieses Album ist Teil deiner aktuellen Auswahl.",
            )
            expect(explanation.source).toBe("role")
        })
    })
})
