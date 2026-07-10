import { useState, useRef } from "react"

import type { Album, AlbumAcquisitionReason, AlbumLifePhase } from "../../../types/album"

import Button from "../../ui/Button"
import Dialog from "../../ui/Dialog"
import TextField from "../../ui/TextField"
import AlbumCover from "../../ui/AlbumCover"

const ACQUISITION_LABELS: Record<AlbumAcquisitionReason, string> = {
    artist: "Ich mag den Künstler / die Band",
    "friend-recommendation": "Empfehlung von einem Freund",
    "specific-song": "Wegen eines bestimmten Songs",
    concert: "Nach einem Konzert",
    review: "Rezension / Bestenliste",
    "record-store": "Plattenladen / Zufallsfund",
    gift: "Geschenk",
    "random-discovery": "Zufällig entdeckt",
    "life-phase": "Es gehört zu einer bestimmten Lebensphase",
    other: "Anderer Grund",
}

const LIFE_PHASE_LABELS: Record<AlbumLifePhase, string> = {
    childhood: "Kindheit",
    school: "Schulzeit",
    studies: "Studium",
    "first-apartment": "Erste Wohnung",
    relationship: "Beziehung",
    breakup: "Trennung",
    work: "Beruf",
    travel: "Reise",
    family: "Familie",
    current: "Aktuelle Lebensphase",
    other: "Andere",
}

const ACQUISITION_OPTIONS: AlbumAcquisitionReason[] = [
    "artist",
    "friend-recommendation",
    "specific-song",
    "concert",
    "review",
    "record-store",
    "gift",
    "random-discovery",
    "life-phase",
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
    "other",
]

type EditAlbumDialogProps = {

    album: Album

    onClose: () => void

    onSave: (album: Album) => void

    onUpdateCoverOverride: (
        id: string,
        blob: Blob,
        source: "upload" | "alternative",
    ) => Promise<void>

    onSetCoverUrlOverride: (
        id: string,
        url: string,
    ) => Promise<void>

    onRemoveCoverOverride: (id: string) => Promise<void>

}

function EditAlbumDialog({

    album,

    onClose,

    onSave,

    onUpdateCoverOverride,

    onSetCoverUrlOverride,

    onRemoveCoverOverride,

}: EditAlbumDialogProps) {

    const [draft, setDraft] =
        useState(album)

    const [urlInput, setUrlInput] =
        useState("")

    const [isLoadingUrl, setIsLoadingUrl] =
        useState(false)

    const [error, setError] =
        useState<string | null>(null)

    const fileInputRef =
        useRef<HTMLInputElement>(null)

    async function handleUrlLoad() {

        const trimmed = urlInput.trim()

        if (!trimmed) {

            return

        }

        let validUrl: string

        try {

            validUrl = new URL(trimmed).href

        } catch {

            setError("Bitte eine gültige URL eingeben")

            return

        }

        setIsLoadingUrl(true)

        setError(null)

        try {

            await onSetCoverUrlOverride(
                album.id,
                validUrl,
            )

            setUrlInput("")

            onClose()

        } catch (e) {

            setError(
                e instanceof Error
                    ? e.message
                    : "Fehler beim Setzen der Cover-URL",
            )

        } finally {

            setIsLoadingUrl(false)

        }

    }

    const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

    async function handleFileUpload(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {

        const file =
            event.target.files?.[0]

        if (!file) {

            return

        }

        if (!file.type.startsWith("image/")) {

            setError("Bitte ein Bild im Format JPG, PNG oder WebP hochladen")

            if (fileInputRef.current) {

                fileInputRef.current.value = ""

            }

            return

        }

        if (file.size > MAX_FILE_SIZE) {

            setError("Das Bild ist zu groß. Maximal 2 MB erlaubt.")

            if (fileInputRef.current) {

                fileInputRef.current.value = ""

            }

            return

        }

        setError(null)

        try {

            await onUpdateCoverOverride(
                album.id,
                file,
                "upload",
            )

            if (fileInputRef.current) {

                fileInputRef.current.value = ""

            }

            onClose()

        } catch (e) {

            const message = e instanceof Error ? e.message : "Fehler beim Hochladen des Covers"

            if (message.includes("QuotaExceededError") || message.includes("quota")) {

                setError("Speicher voll. Bitte alte Covers löschen oder Browser-Cache leeren.")

            } else {

                setError(message)

            }

        }

    }

    async function handleReset() {

        setError(null)

        try {

            await onRemoveCoverOverride(album.id)

            onClose()

        } catch (e) {

            setError(
                e instanceof Error
                    ? e.message
                    : "Fehler beim Zurücksetzen",
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
            const { story: _, ...rest } = prev
            return rest
        })
    }

    if (!draft) {

        return null

    }

    const coverSourceLabel =
        album.coverOverride?.type === "custom"
            ? album.coverOverride.source === "upload"
                ? "Eigenes Cover"
                : "Alternatives Cover"
            : album.coverOverride?.type === "url"
                ? "URL-Override"
                : null

    return (

        <Dialog open={true}>

            <div className="library-maintenance-dialog">

                <h2>

                    Album bearbeiten

                </h2>

                <p>

                    Korrigiere die Metadaten dieses Albums.
                    Die Rolle bleibt unverändert.

                </p>

                <label>

                    <span>

                        Titel

                    </span>

                    <TextField
                        placeholder="Albumtitel"
                        value={draft.title}
                        onChange={(value) =>
                            setDraft({
                                ...draft,
                                title: value,
                            })
                        }
                    />

                </label>

                <label>

                    <span>

                        Artist

                    </span>

                    <TextField
                        placeholder="Artist"
                        value={draft.artist}
                        onChange={(value) =>
                            setDraft({
                                ...draft,
                                artist: value,
                            })
                        }
                    />

                </label>

                <label>

                    <span>

                        Jahr

                    </span>

                    <TextField
                        placeholder="Erscheinungsjahr"
                        value={draft.year}
                        onChange={(value) =>
                            setDraft({
                                ...draft,
                                year: value,
                            })
                        }
                    />

                </label>

                <label>

                    <span>

                        Cover-URL

                    </span>

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

                <div className="edit-cover-section">

                    <h3>

                        Cover

                    </h3>

                    <div className="edit-cover-preview">

                        <AlbumCover
                            coverUrl={album.coverUrl}
                            coverOverride={album.coverOverride}
                            albumId={album.id}
                            title={album.title}
                            alt={`Cover von ${album.title}`}
                        />

                    </div>

                    {
                        coverSourceLabel && (

                            <div className="cover-override-badge">

                                {coverSourceLabel}

                            </div>

                        )
                    }

                    <div className="cover-url-row">

                        <TextField
                            placeholder="Bild-URL eingeben..."
                            value={urlInput}
                            onChange={setUrlInput}
                        />

                        <Button
                            variant="secondary"
                            onClick={handleUrlLoad}
                            disabled={
                                isLoadingUrl
                                || !urlInput.trim()
                            }
                        >

                            {isLoadingUrl
                                ? "Laden..."
                                : "Laden"
                            }

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

                            Bild hochladen

                        </label>

                    </div>

                    {
                        album.coverOverride && (

                            <Button
                                variant="secondary"
                                onClick={handleReset}
                            >

                                Cover zurücksetzen

                            </Button>

                        )
                    }

                    {
                        error && (

                            <p className="cover-error">

                                {error}

                            </p>

                        )
                    }

                </div>

                <div className="edit-story-section">

                    <h3>

                        Geschichte

                    </h3>

                    <label>

                        <span>

                            Warum hast du das Album erworben?

                        </span>

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

                            <option value="">

                                Bitte auswählen...

                            </option>

                            {ACQUISITION_OPTIONS.map((option) => (

                                <option
                                    key={option}
                                    value={option}
                                >

                                    {ACQUISITION_LABELS[option]}

                                </option>

                            ))}

                        </select>

                    </label>

                    <label>

                        <span>

                            Lebensphase

                        </span>

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

                            <option value="">

                                Bitte auswählen...

                            </option>

                            {LIFE_PHASE_OPTIONS.map((option) => (

                                <option
                                    key={option}
                                    value={option}
                                >

                                    {LIFE_PHASE_LABELS[option]}

                                </option>

                            ))}

                        </select>

                    </label>

                    <label>

                        <span>

                            Erinnerung / Notiz

                        </span>

                        <textarea
                            className="story-textarea"
                            placeholder="Woran erinnerst du dich, wenn du dieses Album hörst?"
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

                            Geschichte löschen

                        </Button>

                    )}

                </div>

                <div className="dialog-actions">

                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >

                        Abbrechen

                    </Button>

                    <Button
                        onClick={() => {
                            const coverUrlChanged =
                                draft.coverUrl !== album.coverUrl

                            onSave({
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

                            onClose()
                        }}
                    >

                        Speichern

                    </Button>

                </div>

            </div>

        </Dialog>

    )

}

export default EditAlbumDialog
