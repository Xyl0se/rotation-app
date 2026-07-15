import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught error:", error, errorInfo)
        this.setState({ error, errorInfo })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="error-boundary">
                    <h1 className="error-boundary__title">Something went wrong</h1>
                    <p className="error-boundary__message">
                        The application encountered an unexpected error.
                    </p>
                    <button
                        className="error-boundary__retry"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </button>
                    {this.state.error && (
                        <details className="error-boundary__details">
                            <summary>Technical Details</summary>
                            <pre>{this.state.error.toString()}</pre>
                            {this.state.errorInfo && (
                                <pre>{this.state.errorInfo.componentStack}</pre>
                            )}
                        </details>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}
