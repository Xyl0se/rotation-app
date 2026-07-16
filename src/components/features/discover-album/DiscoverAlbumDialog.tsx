import { useEffect, useState } from "react"

import type { Album, AlbumAcquisitionReason, AlbumLifePhase } from "../../../types/album"

import Dialog from "../../ui/Dialog"
import StepIndicator from "../../ui/StepIndicator"
import Button from "../../ui/Button"
import { searchAlbum } from "../../../services/music/albumMetadata"
import { useI18n } from "../../../i18n/useI18n"
import AlbumCover from "../../ui/AlbumCover"

type DiscoverStep = "title" | "artist" | "metadata" | "story"

const steps: DiscoverStep[] = ["title", "artist", "metadata", "story"]
const acquisitionOptions: AlbumAcquisitionReason[] = [
    "artist", "friend-recommendation", "specific-song", "concert", "review",
    "record-store", "gift", "random-discovery", "life-phase", "other",
]
const lifePhaseOptions: AlbumLifePhase[] = [
    "childhood", "school", "studies", "first-apartment", "relationship",
    "breakup", "work", "travel", "family", "current", "other",
]

interface DiscoverAlbumDialogProps {
    open: boolean
    album: Album
    setAlbum: React.Dispatch<React.SetStateAction<Album>>
    onClose: () => void
    onFinish: (album: Album) => void
    prefill?: { title?: string; artist?: string }
}

function DiscoverAlbumDialog({
    open,
    album,
    setAlbum,
    onClose,
    onFinish,
    prefill,
}: DiscoverAlbumDialogProps) {
    const { t } = useI18n()
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [metadataState, setMetadataState] = useState<
        "idle" | "searching" | "found" | "not-found"
    >("idle")
    const prefillTitle = prefill?.title
    const prefillArtist = prefill?.artist

    useEffect(() => {
        if (open && (prefillTitle || prefillArtist)) {
            queueMicrotask(() => {
                setAlbum(prev => ({
                    ...prev,
                    ...(prefillTitle && { title: prefillTitle }),
                    ...(prefillArtist && { artist: prefillArtist }),
                }))
                if (prefillTitle && prefillArtist) {
                    setCurrentStepIndex(2) // skip to metadata step
                } else if (prefillTitle) {
                    setCurrentStepIndex(1) // skip to artist step
                }
            })
        }
    }, [open, prefillTitle, prefillArtist, setAlbum])

    const currentStep = steps[currentStepIndex]

    function handleNext() {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1)
            return
        }
        onFinish(album)
        setCurrentStepIndex(0)
        setMetadataState("idle")
    }

    function handleBack() {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1)
        }
    }

    function canProceed() {
        switch (currentStep) {
            case "title":
                return album.title.trim().length > 0
            case "artist":
                return album.artist.trim().length > 0
            case "metadata":
                return true
            case "story":
                return true
            default:
                return false
        }
    }

    function updateStory(
        field: "acquiredBecause" | "lifePhase" | "memoryNote",
        value: string,
    ) {
        setAlbum(previous => {
            const now = new Date().toISOString()
            const story = {
                createdAt: previous.story?.createdAt ?? now,
                updatedAt: now,
                ...previous.story,
                [field]: value || undefined,
            }
            const hasContent = story.acquiredBecause || story.lifePhase || story.memoryNote
            return { ...previous, story: hasContent ? story : undefined }
        })
    }

    async function handleFetchMetadata() {
        setMetadataState("searching")
        try {
            const metadata = await searchAlbum(album.title, album.artist)
            if (metadata) {
                setAlbum(prev => ({
                    ...prev,
                    year: metadata.year ?? prev.year,
                    coverUrl: metadata.coverUrl ?? prev.coverUrl,
                }))
                setMetadataState("found")
            } else {
                setMetadataState("not-found")
            }
        } catch {
            setMetadataState("not-found")
        }
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <div className="discover-album-dialog">
                <header className="discover-dialog-header">
                    <span>{t.discoverAlbum.eyebrow}</span>
                    <h2>{t.discoverAlbum.title}</h2>
                    <p>{t.discoverAlbum.subtitle}</p>
                </header>
                <StepIndicator
                    current={currentStepIndex}
                    total={steps.length}
                />

                <div className="discover-step">
                    {currentStep === "title" && (
                        <label className="discover-field">
                            {t.discoverAlbum.steps.title.label}
                            <input
                                type="text"
                                value={album.title}
                                onChange={e =>
                                    setAlbum(prev => ({
                                        ...prev,
                                        title: e.target.value,
                                    }))
                                }
                                placeholder={t.discoverAlbum.steps.title.placeholder}
                                autoFocus
                            />
                        </label>
                    )}

                    {currentStep === "artist" && (
                        <label className="discover-field">
                            {t.discoverAlbum.steps.artist.label}
                            <input
                                type="text"
                                value={album.artist}
                                onChange={e =>
                                    setAlbum(prev => ({
                                        ...prev,
                                        artist: e.target.value,
                                    }))
                                }
                                placeholder={t.discoverAlbum.steps.artist.placeholder}
                                autoFocus
                            />
                        </label>
                    )}

                    {currentStep === "metadata" && (
                        <div className="discover-metadata-step">
                            {metadataState === "idle" && (
                                <div className="discover-metadata-actions">
                                    <p>{t.discoverAlbum.steps.metadata.moreInfo}</p>
                                    <Button onClick={handleFetchMetadata}>
                                        {t.discoverAlbum.steps.metadata.addData}
                                    </Button>
                                    <Button variant="secondary" onClick={handleNext}>
                                        {t.discoverAlbum.steps.metadata.skip}
                                    </Button>
                                </div>
                            )}

                            {metadataState === "searching" && (
                                <p>{t.discoverAlbum.steps.metadata.searching}</p>
                            )}

                            {metadataState === "found" && (
                                <div className="discover-metadata-found">
                                    <p>{t.discoverAlbum.steps.metadata.found}</p>
                                    {album.year && (
                                        <p>{t.discoverAlbum.steps.year.label}: {album.year}</p>
                                    )}
                                    {album.coverUrl && (
                                        <AlbumCover albumId={album.id} coverUrl={album.coverUrl} title={album.title} alt={t.common.coverOf(album.title)} className="discover-cover-preview" />
                                    )}
                                    <Button onClick={handleNext}>
                                        {t.discoverAlbum.next}
                                    </Button>
                                </div>
                            )}

                            {metadataState === "not-found" && (
                                <div className="discover-metadata-notfound">
                                    <p>{t.discoverAlbum.steps.metadata.notFound}</p>
                                    <Button onClick={handleNext}>
                                        {t.discoverAlbum.next}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === "story" && (
                        <div className="discover-story-step">
                            <div className="discover-story-heading">
                                <span aria-hidden="true">⌁</span>
                                <div>
                                    <h3>{t.discoverAlbum.steps.story.title}</h3>
                                    <p>{t.discoverAlbum.steps.story.description}</p>
                                </div>
                            </div>
                            <div className="discover-story-grid">
                                <label>
                                    <span>{t.discoverAlbum.steps.story.acquiredBecause}</span>
                                    <select value={album.story?.acquiredBecause ?? ""}
                                        onChange={event => updateStory("acquiredBecause", event.target.value)}>
                                        <option value="">{t.discoverAlbum.steps.story.optional}</option>
                                        {acquisitionOptions.map(option => (
                                            <option key={option} value={option}>{t.acquisitionReasons[option]}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    <span>{t.discoverAlbum.steps.story.lifePhase}</span>
                                    <select value={album.story?.lifePhase ?? ""}
                                        onChange={event => updateStory("lifePhase", event.target.value)}>
                                        <option value="">{t.discoverAlbum.steps.story.optional}</option>
                                        {lifePhaseOptions.map(option => (
                                            <option key={option} value={option}>{t.lifePhases[option]}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label className="discover-memory-field">
                                <span>{t.discoverAlbum.steps.story.memoryNote}</span>
                                <textarea rows={4} value={album.story?.memoryNote ?? ""}
                                    placeholder={t.discoverAlbum.steps.story.memoryPlaceholder}
                                    onChange={event => updateStory("memoryNote", event.target.value)} />
                            </label>
                        </div>
                    )}
                </div>

                {currentStep !== "metadata" && (
                    <div className="dialog-actions">
                        {currentStepIndex > 0 && (
                            <Button variant="secondary" onClick={handleBack}>
                                {t.discoverAlbum.back}
                            </Button>
                        )}
                        <Button onClick={handleNext} disabled={!canProceed()}>
                            {currentStepIndex === steps.length - 1
                                ? t.discoverAlbum.finish
                                : t.discoverAlbum.next}
                        </Button>
                    </div>
                )}
            </div>
        </Dialog>
    )
}

export default DiscoverAlbumDialog
