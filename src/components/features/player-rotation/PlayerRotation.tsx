import { useState } from "react"

import type { Album } from "../../../types/album"

import {
    roles,
    type RoleId,
} from "../../../domain/roles"

import type {
    RotationPlan,
    RotationPlanItem,
} from "../../../domain/rotation-plan/rotationPlan"

import type { ListenEvent } from "../../../domain/listening/listenEvents"

import AlbumCover from "../../ui/AlbumCover"
import RotationTileTooltip from "./RotationTileTooltip"
import { useI18n } from "../../../i18n/useI18n"

type PlayerRotationProps = {

    albums: Album[]

    plan: RotationPlan | null

    listenEvents: ListenEvent[]

    onGenerate: () => void

    onRemove?: (albumId: string) => void

    onReplace?: (
        removedAlbumId: string,
        replacementAlbumId: string,
    ) => void

    onAccept?: () => void

    onGetReplacementCandidates?: (
        removedAlbumId: string,
    ) => Album[]

}

function getRoleTitle(role: RoleId): string {

    return roles.find(item => item.id === role)?.title ?? role

}

function getRoleIcon(role: RoleId): string {

    return roles.find(item => item.id === role)?.icon ?? ""

}

function PlayerRotation({

    albums,

    plan,

    listenEvents,

    onGenerate,

    onRemove,

    onReplace,

    onAccept,

    onGetReplacementCandidates,

}: PlayerRotationProps) {

    const { t } = useI18n()
    const isDraft =
        plan?.status === "draft"

    const albumsById =
        new Map(albums.map(album => [album.id, album]))

    const planItems =
        plan?.items
            .map(item => ({
                item,
                album: albumsById.get(item.albumId),
            }))
            .filter(
                (
                    entry,
                ): entry is {
                    item: RotationPlanItem
                    album: Album
                } => entry.album !== undefined,
            ) ?? []

    const compositionCounts =
        planItems.reduce(
            (counts, entry) => {

                counts.set(
                    entry.item.role,
                    (counts.get(entry.item.role) ?? 0) + 1,
                )

                return counts

            },
            new Map<RoleId, number>(),
        )

    return (

        <section className="player-rotation">

            <div className="player-rotation-header">

                <div>

                    <p className="player-rotation-label">

                        {t.playerRotation.label}

                    </p>

                    <h2>

                        {plan
                            ? t.playerRotation.title(planItems.length)
                            : t.playerRotation.title(0)}

                    </h2>

                    <p>

                        {plan
                            ? isDraft
                                ? t.playerRotation.subtitle.draft
                                : t.playerRotation.subtitle.active
                            : t.playerRotation.subtitle.empty}

                    </p>

                </div>

                <div className="player-rotation-actions">

                    {
                        isDraft && onAccept && (

                            <button
                                className="player-rotation-action accept"
                                onClick={onAccept}
                            >
                                {t.playerRotation.accept}
                            </button>

                        )
                    }

                    <button

                        className="player-rotation-action"

                        onClick={onGenerate}

                    >

                        {plan
                            ? t.playerRotation.newSuggestion
                            : t.playerRotation.generate}

                    </button>

                </div>

            </div>

            {
                plan && (

                    <div className="player-rotation-composition">

                        {
                            roles
                                .filter(role =>
                                    role.id !== "archive" &&
                                    compositionCounts.has(role.id)
                                )
                                .map(role => (

                                    <span key={role.id}>

                                        {role.icon} {role.title}{" "}
                                        {compositionCounts.get(role.id)}

                                    </span>

                                ))
                        }

                    </div>

                )
            }

            {
                planItems.length === 0
                    ? (

                        <div className="player-rotation-empty">

                            <p>

                                {t.playerRotation.emptyHint}

                            </p>

                        </div>

                    )
                    : (

                        <div className="player-rotation-grid">

                            {
                                planItems.map(({ item, album }) => (

                                    <RotationTile

                                        key={item.albumId}

                                        item={item}
                                        album={album}
                                        listenEvents={listenEvents}
                                        isDraft={isDraft}
                                        onRemove={onRemove}
                                        onReplace={onReplace}
                                        onGetReplacementCandidates={
                                            onGetReplacementCandidates
                                        }

                                    />

                                ))
                            }

                        </div>

                    )
            }

        </section>

    )

}

function RotationTile({

    item,
    album,
    listenEvents,
    isDraft,
    onRemove,
    onReplace,
    onGetReplacementCandidates,

}: {

    item: RotationPlanItem
    album: Album
    listenEvents: ListenEvent[]
    isDraft: boolean
    onRemove?: (albumId: string) => void
    onReplace?: (
        removedAlbumId: string,
        replacementAlbumId: string,
    ) => void
    onGetReplacementCandidates?: (
        removedAlbumId: string,
    ) => Album[]

}) {

    const { t } = useI18n()
    const [showReplacements, setShowReplacements] =
        useState(false)

    function handleToggleReplacements() {

        setShowReplacements(previous => !previous)

    }

    const candidates =
        showReplacements && onGetReplacementCandidates
            ? onGetReplacementCandidates(item.albumId)
            : []

    return (

        <article className="player-rotation-tile">

            <RotationTileTooltip
                album={album}
                item={item}
                listenEvents={listenEvents}
            />

            <div className="player-rotation-copy">

                <span>

                    {getRoleIcon(item.role)}{" "}
                    {getRoleTitle(item.role)}

                </span>

                <h3>

                    {album.title}

                </h3>

                <p>

                    {album.artist}

                </p>

            </div>

            {
                isDraft && (

                    <div className="player-rotation-tile-actions">

                        {
                            onRemove && (

                                <button

                                    className="tile-action remove"

                                    onClick={() =>
                                        onRemove(item.albumId)
                                    }

                                    title={t.playerRotation.remove}

                                >
                                    ✕
                                </button>

                            )
                        }

                        {
                            onReplace && onGetReplacementCandidates && (

                                <button

                                    className="tile-action replace"

                                    onClick={handleToggleReplacements}

                                    title={t.playerRotation.replace}

                                >
                                    ↻
                                </button>

                            )
                        }

                    </div>

                )
            }

            {
                showReplacements && candidates.length > 0 && (

                    <div className="player-rotation-replacements">

                        <p className="replacement-hint">
                            {t.playerRotation.replaceTitle}:
                        </p>

                        <div className="replacement-candidates">

                            {
                                candidates.map(candidate => (

                                    <button

                                        key={candidate.id}

                                        className="replacement-candidate"

                                        onClick={() => {

                                            onReplace?.(
                                                item.albumId,
                                                candidate.id,
                                            )

                                            setShowReplacements(false)

                                        }}

                                        title={`${candidate.title} – ${candidate.artist}`}

                                    >

                                        <AlbumCover
                                            coverUrl={candidate.coverUrl}
                                            coverOverride={candidate.coverOverride}
                                            albumId={candidate.id}
                                            title={candidate.title}
                                            alt={`Cover: ${candidate.title}`}
                                            className="replacement-cover"
                                        />

                                        <span className="replacement-title">

                                            {candidate.title}

                                        </span>

                                    </button>

                                ))
                            }

                        </div>

                    </div>

                )
            }

        </article>

    )

}

export default PlayerRotation
