import TextField from "../../../ui/TextField"

type AlbumTitleStepProps = {
    value: string
    onChange: (value: string) => void
}

function AlbumTitleStep({
    value,
    onChange,
}: AlbumTitleStepProps) {

    return (

        <>

            <p>Wie heißt das Album?</p>

            <TextField
                placeholder="z. B. Dark Side of the Moon"
                value={value}
                onChange={onChange}
            />

        </>

    )

}

export default AlbumTitleStep