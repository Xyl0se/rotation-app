import TextField from "../../../ui/TextField"

type ArtistStepProps = {
    value: string
    onChange: (value: string) => void
}

function ArtistStep({
    value,
    onChange,
}: ArtistStepProps) {

    return (

        <>

            <p>Von wem ist das Album?</p>

            <TextField
                placeholder="Pink Floyd"
                value={value}
                onChange={onChange}
            />

        </>

    )

}

export default ArtistStep