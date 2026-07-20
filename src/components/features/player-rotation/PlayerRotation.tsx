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
import { fetchRotationHandover, type RotationHandoverPreview } from "../../../services/api/rotationStateService"
import { formatFileSize } from "../../../utils/formatFileSize"

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

    onOpenAlbum?: (albumId: string) => void

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

    onOpenAlbum,

}: PlayerRotationProps) {
    const { t } = useI18n()
    const isDraft =
        plan?.status === "draft"
    const [confirmingAcceptance, setConfirmingAcceptance] = useState(false)
    const [handover,setHandover]=useState<RotationHandoverPreview|null>(null)
    const [handoverError,setHandoverError]=useState<string|null>(null)
    const [handoverLoading,setHandoverLoading]=useState(false)

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
                                onClick={async () => {
                                    setHandoverLoading(true)
                                    setHandoverError(null)
                                    try {
                                        setHandover(await fetchRotationHandover())
                                        setConfirmingAcceptance(true)
                                    } catch (cause) {
                                        setHandoverError(cause instanceof Error
                                            ? cause.message
                                            : t.playerRotation.handover.error)
                                    } finally {
                                        setHandoverLoading(false)
                                    }
                                }}
                                disabled={handoverLoading}
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

            {handoverError && <p className="sync-status sync-status--warning" role="alert">{handoverError}</p>}
            {isDraft && confirmingAcceptance && onAccept && handover && (
                <div className="rotation-handover" role="dialog" aria-modal="true" aria-label={t.playerRotation.handover.title}>
                    <h3>{t.playerRotation.handover.title}</h3>
                    <p>{t.playerRotation.handover.summary(handover.entering.length, handover.leaving.length, handover.unchanged.length)}</p>
                    <p>{t.playerRotation.handover.size(handover.size, handover.targetSize)}</p>
                    <div className="handover-role-grid">{(["new","comfort-food","classic","growing"] as RoleId[]).map(role=><span key={role}>{getRoleIcon(role)} {t.roles[role].title}: {handover.beforeRoles[role]??0} → {handover.afterRoles[role]??0}{(handover.quotaGaps[role]??0)>0?` · ${t.playerRotation.handover.missingQuota(handover.quotaGaps[role]!)}`:""}</span>)}</div>
                    <p>{t.playerRotation.handover.exportEstimate(formatFileSize(handover.estimatedSizeBytes),handover.fileCount)}</p>
                    {(handover.missingBindings.length>0||handover.unconfirmedBindings.length>0)&&<p className="export-warning">{t.playerRotation.handover.bindingWarning(handover.missingBindings.length,handover.unconfirmedBindings.length)}</p>}
                    {!handover.exportReady&&<p>{t.playerRotation.handover.acceptButNotExportable}</p>}
                    <div className="player-rotation-actions">
                        <button className="player-rotation-action" onClick={() => setConfirmingAcceptance(false)}>{t.exportPage.cancel}</button>
                        <button className="player-rotation-action accept" onClick={() => { setConfirmingAcceptance(false); onAccept() }}>{t.playerRotation.handover.confirm}</button>
                    </div>
                </div>
            )}

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
                                        onOpenAlbum={onOpenAlbum}

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
    onOpenAlbum,

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
    onOpenAlbum?: (albumId: string) => void

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

            <button
                className="player-rotation-tile-link"
                onClick={() => onOpenAlbum?.(album.id)}
                aria-label={`${album.title} von ${album.artist} öffnen`}
            >
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
            </button>

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
