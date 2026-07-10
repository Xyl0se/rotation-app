import Button from "../ui/Button"
import Card from "../ui/Card"

type EmptyLibraryProps = {
    onDiscoverAlbum: () => void
}

function EmptyLibrary({ onDiscoverAlbum }: EmptyLibraryProps) {
    return (
        <Card>

            <h2>Noch keine Alben</h2>

            <p>
                Beginne deine persönliche Musiksammlung,
                indem du dein erstes Album hinzufügst.
            </p>

            <Button onClick={onDiscoverAlbum}>
                Neues Album entdecken
            </Button>

        </Card>
    )
}

export default EmptyLibrary