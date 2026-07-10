import { useState } from "react"

import type { Album } from "../../../types/album"

import { searchAlbum } from "../../../services/music/albumMetadata"

import {
    saveCustomCover,
} from "../../../repositories/coverCache"

import Dialog from "../../ui/Dialog"
import Button from "../../ui/Button"
import StepIndicator from "../../ui/StepIndicator"

import AlbumTitleStep from "./steps/AlbumTitleStep"
import ArtistStep from "./steps/ArtistStep"
import MetadataLookupStep from "./steps/MetadataLookupStep"

import AlbumCoach from "../album-coach/AlbumCoach"

type DiscoverAlbumDialogProps = {
    open: boolean
    album: Album
    setAlbum: React.Dispatch<React.SetStateAction<Album>>
    onClose: () => void
    onFinish: (album: Album) => void
}

type MetadataLookupState =
    | "idle"
    | "searching"
    | "success"
    | "not-found"
    | "error"

function DiscoverAlbumDialog({
    open,
    album,
    setAlbum,
    onClose,
    onFinish,
}: DiscoverAlbumDialogProps) {

    const [step, setStep] = useState(0)

    const [loadingMetadata, setLoadingMetadata] =
        useState(false)

    const [metadataState, setMetadataState] =
        useState<MetadataLookupState>("idle")

    async function handleMetadataLookup() {

        setLoadingMetadata(true)

        setMetadataState("searching")

        try {

            const metadata =
                await searchAlbum(

                    album.title,

                    album.artist,

                )

            if (metadata) {

                let coverOverride =
                    undefined

                if (metadata.coverUrl) {

                    try {

                        const response =
                            await fetch(
                                metadata.coverUrl,
                            )

                        if (response.ok) {

                            const blob =
                                await response.blob()

                            if (
                                blob.size > 0
                                && blob.type.startsWith("image/")
                            ) {

                                await saveCustomCover(
                                    album.id,
                                    blob,
                                    { source: "alternative" },
                                )

                                const blobUrl =
                                    URL.createObjectURL(blob)

                                coverOverride = {
                                    type: "custom" as const,
                                    albumId: album.id,
                                    blobUrl,
                                    source: "alternative" as const,
                                    fetchedAt: new Date().toISOString(),
                                }

                            }

                        }

                    } catch (e) {

                        console.warn(
                            "Cover-Download fehlgeschlagen, verwende URL stattdessen",
                            e,
                        )

                    }

                }

                if (
                    album.coverOverride?.type === "custom"
                    && album.coverOverride.blobUrl
                ) {

                    URL.revokeObjectURL(
                        album.coverOverride.blobUrl,
                    )

                }

                setAlbum({

                    ...album,

                    year: metadata.year ?? album.year,

                    coverUrl: metadata.coverUrl,

                    coverOverride,

                })

                setMetadataState("success")

            } else {

                setMetadataState("not-found")

            }

        } catch (error) {

            console.error(error)

            setMetadataState("error")

        } finally {

            setLoadingMetadata(false)

            setTimeout(() => {

                setStep(3)

                setMetadataState("idle")

            }, 1200)

        }

    }

    function renderStep() {

        switch (step) {

            case 0:

                return (

                    <AlbumTitleStep

                        value={album.title}

                        onChange={(value) =>

                            setAlbum({

                                ...album,

                                title: value,

                            })

                        }

                    />

                )

            case 1:

                return (

                    <ArtistStep

                        value={album.artist}

                        onChange={(value) =>

                            setAlbum({

                                ...album,

                                artist: value,

                            })

                        }

                    />

                )

            case 2:

                return (

                    <MetadataLookupStep

                        loading={loadingMetadata}

                        state={metadataState}

                        onSearch={handleMetadataLookup}

                        onSkip={() =>

                            setStep(3)

                        }

                    />

                )

            case 3:

                return (

                    <AlbumCoach

                        albumTitle={album.title}

                        onComplete={(role) => {

                            const completedAlbum: Album = {

                                ...album,

                                category: role,

                                roleHistory: [

                                    ...album.roleHistory,

                                    {

                                        role,

                                        recordedAt:
                                            new Date().toISOString(),

                                        source: "coach",

                                    },

                                ],

                            }

                            setAlbum(completedAlbum)

                            setStep(0)

                            onFinish(completedAlbum)

                        }}

                    />

                )

            default:

                return null

        }

    }

    const showNavigation = step < 2

    return (

        <Dialog open={open}>

            <div className="discover-dialog">

                <h2>

                    Neues Album entdecken

                </h2>

                <StepIndicator

                    current={step}

                    total={4}

                />

                <div className="discover-step">

                    {renderStep()}

                </div>

                {

                    showNavigation && (

                        <div className="dialog-actions">

                            <Button

                                variant="secondary"

                                onClick={() => {

                                    if (step === 0) {

                                        onClose()

                                        return

                                    }

                                    setStep(step - 1)

                                }}

                            >

                                {

                                    step === 0

                                        ? "Abbrechen"

                                        : "Zurück"

                                }

                            </Button>

                            <Button

                                onClick={() =>

                                    setStep(step + 1)

                                }

                            >

                                Weiter

                            </Button>

                        </div>

                    )

                }

            </div>

        </Dialog>

    )

}

export default DiscoverAlbumDialog
