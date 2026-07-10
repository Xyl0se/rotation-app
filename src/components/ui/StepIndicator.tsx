type StepIndicatorProps = {
    current: number
    total: number
}

function StepIndicator({
    current,
    total,
}: StepIndicatorProps) {

    return (

        <div className="step-indicator">

            {Array.from({ length: total }).map((_, index) => (

                <div
                    key={index}
                    className={
                        index <= current
                            ? "step active"
                            : "step"
                    }
                />

            ))}

        </div>

    )

}

export default StepIndicator