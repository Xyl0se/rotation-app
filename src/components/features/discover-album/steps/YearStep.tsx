import TextField from "../../../ui/TextField"

type YearStepProps = {
    value: string
    onChange: (value: string) => void
}

function YearStep({
    value,
    onChange,
}: YearStepProps) {

    return (

        <>

            <p>Wann erschien das Album?</p>

            <TextField
                placeholder="1973"
                value={value}
                onChange={onChange}
            />

        </>

    )

}

export default YearStep