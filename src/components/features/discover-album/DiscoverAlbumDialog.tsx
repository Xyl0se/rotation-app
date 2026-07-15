import { useEffect, useState } from "react"

import type { Album } from "../../../types/album"

import Dialog from "../../ui/Dialog"
import StepIndicator from "../../ui/StepIndicator"
import Button from "../../ui/Button"
import { searchAlbum } from "../../../services/music/albumMetadata"
import { useI18n } from "../../../i18n/useI18n"

type DiscoverStep = "title" | "artist" | "metadata" | "year"

const steps: DiscoverStep[] = ["title", "artist", "metadata"]

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

    useEffect(() => {
        if (open && prefill) {
            queueMicrotask(() => {
                setAlbum(prev => ({
                    ...prev,
                    ...(prefill.title && { title: prefill.title }),
                    ...(prefill.artist && { artist: prefill.artist }),
                }))
                if (prefill.title && prefill.artist) {
                    setCurrentStepIndex(2) // skip to metadata step
                } else if (prefill.title) {
                    setCurrentStepIndex(1) // skip to artist step
                }
            })
        }
    }, [open, prefill, setAlbum])

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
            default:
                return false
        }
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
                                        <p>Year: {album.year}</p>
                                    )}
                                    {album.coverUrl && (
                                        <img
                                            src={album.coverUrl}
                                            alt={`Cover: ${album.title}`}
                                            className="discover-cover-preview"
                                        />
                                    )}
                                    <Button onClick={handleNext}>
                                        {t.discoverAlbum.finish}
                                    </Button>
                                </div>
                            )}

                            {metadataState === "not-found" && (
                                <div className="discover-metadata-notfound">
                                    <p>{t.discoverAlbum.steps.metadata.notFound}</p>
                                    <Button onClick={handleNext}>
                                        {t.discoverAlbum.finish}
                                    </Button>
                                </div>
                            )}
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
