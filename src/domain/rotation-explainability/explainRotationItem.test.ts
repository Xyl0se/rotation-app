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
    describe("Role explanation", () => {
        it("explains a 'new' album", () => {
            const album = makeAlbum({
                category: "new",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
            })
            const item = makeItem({ role: "new" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "This album is new in your collection and waiting to be discovered.",
            )
            expect(explanation.source).toBe("role")
        })

        it("explains a 'growing' album", () => {
            const album = makeAlbum({
                category: "growing",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
            })
            const item = makeItem({ role: "growing" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "This album grows a little more with every listen.",
            )
            expect(explanation.source).toBe("role")
        })

        it("explains a 'comfort-food' album", () => {
            const album = makeAlbum({
                category: "comfort-food",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
            })
            const item = makeItem({ role: "comfort-food" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "This album brings familiarity to the current selection.",
            )
            expect(explanation.source).toBe("role")
        })

        it("explains a 'classic' album", () => {
            const album = makeAlbum({
                category: "classic",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
            })
            const item = makeItem({ role: "classic" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "This album has accompanied you for a long time and forms a calm center.",
            )
            expect(explanation.source).toBe("role")
        })

        it("explains an 'admire' album", () => {
            const album = makeAlbum({
                category: "admire",
                listenCount: 1,
                lastListened: "2024-06-10T00:00:00Z",
            })
            const item = makeItem({ role: "admire" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "This album is highly valued by you — even if you don't reach for it often.",
            )
            expect(explanation.source).toBe("role")
        })
    })

    describe("Listen history explanation", () => {
        it("mentions missing listen session when never listened", () => {
            const album = makeAlbum({
                category: "new",
                listenCount: 0,
                lastListened: null,
            })
            const item = makeItem({ role: "new" })
            const events: ListenEvent[] = []
            const explanation = explainRotationItem(album, item, events, now)

            expect(explanation.text).toBe(
                "It's waiting for its first listen session.",
            )
            expect(explanation.source).toBe("listen-history")
        })

        it("mentions missing listen session primarily via listenEvents", () => {
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

        it("mentions not listened in a while when lastListened is old", () => {
            const album = makeAlbum({
                category: "comfort-food",
                listenCount: 3,
                lastListened: "2024-01-01T00:00:00Z",
            })
            const item = makeItem({ role: "comfort-food" })
            const events: ListenEvent[] = []
            const explanation = explainRotationItem(album, item, events, now)

            expect(explanation.text).toBe(
                "It hasn't been listened to in a while.",
            )
            expect(explanation.source).toBe("listen-history")
        })

        it("uses listenEvents primarily for not listened in a while", () => {
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
                "It hasn't been listened to in a while.",
            )
            expect(explanation.source).toBe("listen-history")
        })

        it("mentions frequent listening when count >= 5 and recently listened", () => {
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
                "You've listened to it a lot recently.",
            )
            expect(explanation.source).toBe("listen-history")
        })
    })

    describe("Role history explanation", () => {
        it("mentions short role when roleHistory younger than 14 days", () => {
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
                "It's only recently become part of this role.",
            )
            expect(explanation.source).toBe("role-history")
        })

        it("mentions long role when roleHistory older than 180 days", () => {
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
                "It has belonged to this role for a long time.",
            )
            expect(explanation.source).toBe("role-history")
        })
    })

    describe("Plan reason explanation", () => {
        it("mentions fill reason when reason = 'fill' and no other explanation applies", () => {
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
                "It complements the current selection.",
            )
            expect(explanation.source).toBe("plan-reason")
        })
    })

    describe("Story explanation", () => {
        it("considers Story: friend-recommendation", () => {
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
                "It originally came into your collection through a recommendation.",
            )
            expect(explanation.source).toBe("story")
        })

        it("considers Story: concert", () => {
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
                "It's connected to a concert.",
            )
            expect(explanation.source).toBe("story")
        })

        it("considers Story: gift", () => {
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
                "It's a gift that remained in your collection.",
            )
            expect(explanation.source).toBe("story")
        })

        it("considers Story: lifePhase", () => {
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
                "It's connected to a specific life phase.",
            )
            expect(explanation.source).toBe("story")
        })

        it("considers Story: memoryNote", () => {
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
                    memoryNote: "Got me through the winter.",
                    createdAt: "2023-01-01T00:00:00Z",
                    updatedAt: "2023-01-01T00:00:00Z",
                },
            })
            const item = makeItem({ role: "archive" })
            const explanation = explainRotationItem(album, item, [], now)

            expect(explanation.text).toBe(
                "A personal memory is attached to it.",
            )
            expect(explanation.source).toBe("story")
        })
    })

    describe("Prioritization", () => {
        it("prioritizes listen-history over role-history", () => {
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
                "It's waiting for its first listen session.",
            )
        })

        it("prioritizes role-history over role", () => {
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
                "It's only recently become part of this role.",
            )
        })

        it("prioritizes role over story", () => {
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

        it("prioritizes story over plan-reason", () => {
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
        it("returns fallback when nothing applies", () => {
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
                "This album is part of your current selection.",
            )
            expect(explanation.source).toBe("role")
        })
    })
})
