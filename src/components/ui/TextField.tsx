type TextFieldProps = {
    placeholder: string
    value: string
    onChange: (value: string) => void
}

function TextField({
    placeholder,
    value,
    onChange,
}: TextFieldProps) {

    return (

        <input
            className="text-field"
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />

    )

}

export default TextField