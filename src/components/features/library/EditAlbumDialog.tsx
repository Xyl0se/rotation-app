import { useState, useRef } from "react"

import type { Album, AlbumAcquisitionReason, AlbumLifePhase } from "../../../types/album"
import type { Binding } from "../../../services/api/bindingsService"

import Button from "../../ui/Button"
import Dialog from "../../ui/Dialog"
import TextField from "../../ui/TextField"
import AlbumCover from "../../ui/AlbumCover"
import { useI18n } from "../../../i18n/useI18n"
import type { ListenEvent } from "../../../domain/listening/listenEvents"
import type { CoverResolutionDiagnostics } from "../../../services/api/coversService"

const ACQUISITION_OPTIONS: AlbumAcquisitionReason[] = [
    "artist",
    "friend-recommendation",
    "specific-song",
    "concert",
    "review",
    "record-store",
    "gift",
    "digital",
    "random-discovery",
    "life-phase",
    "completion",
    "collection-essential",
    "unknown",
    "other",
]

const LIFE_PHASE_OPTIONS: AlbumLifePhase[] = [
    "childhood",
    "school",
    "studies",
    "first-apartment",
    "relationship",
    "breakup",
    "work",
    "travel",
    "family",
    "current",
    "unknown",
    "other",
]

type EditAlbumDialogProps = {
    album: Album
    binding?: Binding
    onClose: () => void
    onSave: (album: Album) => Promise<boolean>
    onUpdateCoverOverride: (
        id: string,
        blob: Blob,
        source: "upload" | "alternative",
    ) => Promise<boolean>
    onRemoveCoverOverride: (id: string) => Promise<boolean>
    onRetryCover?: (id: string) => Promise<CoverResolutionDiagnostics | null>
    onStartCoach?: (albumId: string) => void
    listenEvents?: ListenEvent[]
    onEditJournal?: (eventId:string)=>void
}

function EditAlbumDialog({
    album,
    binding,
    onClose,
    onSave,
    onUpdateCoverOverride,
    onRemoveCoverOverride,
    onRetryCover,
    onStartCoach,
    listenEvents=[],
    onEditJournal,
}: EditAlbumDialogProps) {
    const { t } = useI18n()

    const [draft, setDraft] = useState(album)
    const [urlInput, setUrlInput] = useState("")
    const [isLoadingUrl, setIsLoadingUrl] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [coverDiagnostics, setCoverDiagnostics] = useState<CoverResolutionDiagnostics | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleUrlLoad() {
        const trimmed = urlInput.trim()
        if (!trimmed) return

        let validUrl: string
        try {
            validUrl = new URL(trimmed).href
        } catch {
            setError(t.editDialog.errors.invalidUrl)
            return
        }

        setIsLoadingUrl(true)
        setError(null)
        try {
            const response = await fetch(validUrl)
            if (!response.ok) throw new Error(t.editDialog.errors.setCoverUrl)
            const blob = await response.blob()
            if (!blob.type.startsWith("image/") || blob.size > MAX_FILE_SIZE) {
                throw new Error(blob.size > MAX_FILE_SIZE
                    ? t.editDialog.errors.imageTooLarge
                    : t.editDialog.errors.invalidImageFormat)
            }
            if (!await onUpdateCoverOverride(album.id, blob, "alternative")) {
                setError(t.editDialog.errors.setCoverUrl)
                return
            }
            setUrlInput("")
            onClose()
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : t.editDialog.errors.setCoverUrl,
            )
        } finally {
            setIsLoadingUrl(false)
        }
    }

    const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

    async function handleFileUpload(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            setError(t.editDialog.errors.invalidImageFormat)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
            return
        }

        if (file.size > MAX_FILE_SIZE) {
            setError(t.editDialog.errors.imageTooLarge)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
            return
        }

        setError(null)
        try {
            if (!await onUpdateCoverOverride(album.id, file, "upload")) {
                setError(t.editDialog.errors.uploadCover)
                return
            }
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
            onClose()
        } catch (e) {
            const message = e instanceof Error
                ? e.message
                : t.editDialog.errors.uploadCover
            if (message.includes("QuotaExceededError") || message.includes("quota")) {
                setError(t.editDialog.errors.storageFull)
            } else {
                setError(message)
            }
        }
    }

    async function handleReset() {
        setError(null)
        try {
            if (!await onRemoveCoverOverride(album.id)) {
                setError(t.editDialog.errors.generic)
                return
            }
            onClose()
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : t.editDialog.errors.generic,
            )
        }
    }

    function updateStoryField<K extends keyof NonNullable<Album["story"]>>(
        key: K,
        value: NonNullable<Album["story"]>[K],
    ) {
        setDraft((prev) => {
            const now = new Date().toISOString()
            const existing = prev.story ?? {
                createdAt: now,
                updatedAt: now,
            }
            return {
                ...prev,
                story: {
                    ...existing,
                    [key]: value,
                    updatedAt: now,
                },
            }
        })
    }

    function removeStory() {
        setDraft((prev) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { story: _s, ...rest } = prev
            return rest
        })
    }

    if (!draft) return null

    const coverSourceLabel =
        album.coverOverride?.type === "custom"
            ? album.coverOverride.source === "upload"
                ? t.editDialog.coverLabelUpload
                : t.editDialog.coverLabelAlternative
            : album.coverOverride?.type === "url"
                ? t.editDialog.coverLabelUrl
                : null

    return (
        <Dialog open={true}>
            <div className="library-maintenance-dialog">
                <h2>{t.editDialog.title}</h2>
                <p>{t.editDialog.subtitle}</p>

                <label>
                    <span>{t.editDialog.titleLabel}</span>
                    <TextField
                        placeholder={t.discoverAlbum.steps.title.placeholder}
                        value={draft.title}
                        onChange={(value) =>
                            setDraft({ ...draft, title: value })
                        }
                    />
                </label>

                <label>
                    <span>{t.editDialog.artistLabel}</span>
                    <TextField
                        placeholder={t.discoverAlbum.steps.artist.placeholder}
                        value={draft.artist}
                        onChange={(value) =>
                            setDraft({ ...draft, artist: value })
                        }
                    />
                </label>

                <label>
                    <span>{t.editDialog.yearLabel}</span>
                    <TextField
                        placeholder={t.discoverAlbum.steps.year?.placeholder ?? ""}
                        value={draft.year}
                        onChange={(value) =>
                            setDraft({ ...draft, year: value })
                        }
                    />
                </label>

                <label>
                    <span>{t.editDialog.coverUrlLabel}</span>
                    <TextField
                        placeholder="https://..."
                        value={draft.coverUrl ?? ""}
                        onChange={(value) =>
                            setDraft({
                                ...draft,
                                coverUrl: value || undefined,
                            })
                        }
                    />
                </label>

                <div className="edit-binding-info">
                    <span className="edit-binding-label">{t.editDialog.boundFolder}</span>
                    {binding ? (
                        binding.state === "missing" ? (
                            <span
                                className="edit-binding-missing"
                                title={t.albumCard.missingFolderTooltip(binding.relativePath)}
                            >
                                {t.editDialog.folderMissing}
                            </span>
                        ) : (
                            <span
                                className="edit-binding-path"
                                title={t.albumCard.boundTooltip(binding.relativePath)}
                            >
                                {binding.relativePath}
                            </span>
                        )
                    ) : (
                        <span className="edit-binding-none">{t.editDialog.notBound}</span>
                    )}
                </div>

                <div className="edit-cover-section">
                    <h3>{t.common.coverOf("")}</h3>

                    <div className="edit-cover-preview">
                        <AlbumCover
                            coverUrl={album.coverUrl}
                            coverOverride={album.coverOverride}
                            albumId={album.id}
                            title={album.title}
                            alt={t.common.coverOf(album.title)}
                        />
                    </div>

                    {coverSourceLabel && (
                        <div className="cover-override-badge">
                            {coverSourceLabel}
                        </div>
                    )}

                    <div className="cover-url-row">
                        <TextField
                            placeholder="https://..."
                            value={urlInput}
                            onChange={setUrlInput}
                        />
                        <Button
                            variant="secondary"
                            onClick={handleUrlLoad}
                            disabled={isLoadingUrl || !urlInput.trim()}
                        >
                            {isLoadingUrl
                                ? t.common.loading
                                : t.editDialog.loadCover}
                        </Button>
                    </div>

                    <div className="cover-upload-row">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            id={`cover-upload-${album.id}`}
                            className="cover-upload-input"
                        />
                        <label
                            htmlFor={`cover-upload-${album.id}`}
                            className="cover-upload-label"
                        >
                            {t.common.uploadImage}
                        </label>
                    </div>

                    {album.coverOverride && (
                        <Button
                            variant="secondary"
                            onClick={handleReset}
                        >
                            {t.editDialog.resetCover}
                        </Button>
                    )}
                    {onRetryCover && (
                        <Button variant="secondary" onClick={async () => {
                            setIsLoadingUrl(true); setError(null)
                            const diagnostics = await onRetryCover(album.id)
                            setCoverDiagnostics(diagnostics)
                            if (!diagnostics) setError(t.editDialog.errors.setCoverUrl)
                            setIsLoadingUrl(false)
                        }}>{t.editDialog.retryCover}</Button>
                    )}

                    {coverDiagnostics && (
                        <p className="cover-resolution-status" role="status">
                            {coverDiagnostics.status === "cached"
                                ? t.editDialog.coverResolution.cached
                                : coverDiagnostics.failureCode === "local-artwork-not-found"
                                    ? t.editDialog.coverResolution.localNotFound
                                    : coverDiagnostics.failureCode === "invalid-image"
                                        ? t.editDialog.coverResolution.localInvalid
                                        : coverDiagnostics.failureCode === "remote-temporarily-unavailable"
                                            ? t.editDialog.coverResolution.remoteUnavailable
                                            : t.editDialog.coverResolution.notFound}
                        </p>
                    )}

                    {error && (
                        <p className="cover-error">{error}</p>
                    )}
                </div>

                <div className="edit-story-section">
                    <h3>{t.editDialog.storyTitle}</h3>

                    <label>
                        <span>{t.editDialog.acquiredBecauseLabel}</span>
                        <select
                            value={draft.story?.acquiredBecause ?? ""}
                            onChange={(e) => {
                                const value = e.target.value as AlbumAcquisitionReason | ""
                                if (value) {
                                    updateStoryField("acquiredBecause", value)
                                } else {
                                    updateStoryField("acquiredBecause", undefined)
                                }
                            }}
                        >
                            <option value="">{t.editDialog.selectPlaceholder}</option>
                            {ACQUISITION_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {t.editDialog.acquisitionReasons[option]}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>{t.editDialog.lifePhaseLabel}</span>
                        <select
                            value={draft.story?.lifePhase ?? ""}
                            onChange={(e) => {
                                const value = e.target.value as AlbumLifePhase | ""
                                if (value) {
                                    updateStoryField("lifePhase", value)
                                } else {
                                    updateStoryField("lifePhase", undefined)
                                }
                            }}
                        >
                            <option value="">{t.editDialog.selectPlaceholder}</option>
                            {LIFE_PHASE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {t.lifePhases[option]}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>{t.editDialog.memoryNoteLabel}</span>
                        <textarea
                            className="story-textarea"
                            placeholder={t.editDialog.memoryNotePlaceholder}
                            value={draft.story?.memoryNote ?? ""}
                            onChange={(e) =>
                                updateStoryField(
                                    "memoryNote",
                                    e.target.value || undefined,
                                )
                            }
                            rows={4}
                        />
                    </label>

                    {draft.story && (
                        <Button
                            variant="secondary"
                            onClick={removeStory}
                        >
                            {t.editDialog.deleteStory}
                        </Button>
                    )}
                </div>

                {listenEvents.some(event=>event.albumId===album.id&&event.journal)&&<section className="album-journal-list"><h3>{t.journal.previous}</h3>{listenEvents.filter(event=>event.albumId===album.id&&event.journal).map(event=><article key={event.id}><time>{new Date(event.listenedAt).toLocaleDateString()}</time><p>{event.journal?.note}</p>{onEditJournal&&<Button variant="secondary" onClick={()=>onEditJournal(event.id)}>{t.journal.edit}</Button>}</article>)}</section>}

                <div className="dialog-actions">
                    {onStartCoach && (
                        <Button
                            variant="secondary"
                            onClick={() => onStartCoach(album.id)}
                        >
                            {album.category
                                ? t.editDialog.changeRole
                                : t.editDialog.startCoach}
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        {t.editDialog.cancel}
                    </Button>
                    <Button
                        onClick={async () => {
                            const coverUrlChanged =
                                draft.coverUrl !== album.coverUrl
                            const saved = await onSave({
                                ...album,
                                title: draft.title,
                                artist: draft.artist,
                                year: draft.year,
                                coverUrl: draft.coverUrl,
                                coverOverride: coverUrlChanged
                                    ? undefined
                                    : album.coverOverride,
                                story: draft.story,
                            })
                            if (saved) onClose()
                            else setError(t.editDialog.errors.generic)
                        }}
                    >
                        {t.editDialog.save}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default EditAlbumDialog
