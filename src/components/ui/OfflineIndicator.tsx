import { useConnection } from "../../contexts/connectionState"
import { useI18n } from "../../i18n/useI18n"

export default function OfflineIndicator() {
    const { isOnline, apiReachable, isRetrying } = useConnection()
    const { t } = useI18n()

    if (isOnline && apiReachable !== false && !isRetrying) {
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

    if (apiReachable === false && !isRetrying) {
        return (
            <span className="offline-indicator offline-indicator--offline">
                <span className="offline-indicator__dot" />
                {t.nav.apiUnavailable}
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
