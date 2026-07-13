import { useConnection } from "../../contexts/ConnectionContext"
import { useI18n } from "../../i18n/useI18n"

export default function OfflineIndicator() {
    const { isOnline, isRetrying } = useConnection()
    const { t } = useI18n()

    if (isOnline && !isRetrying) {
        return null
    }

    if (!isOnline) {
        return (
            <span className="offline-indicator offline-indicator--offline">
                <span className="offline-indicator__dot" />
                {t.nav.offline}
            </span>
        )
    }

    return (
        <span className="offline-indicator offline-indicator--retrying">
            <span className="offline-indicator__dot offline-indicator__dot--pulse" />
            {t.nav.retrying}
        </span>
    )
}
