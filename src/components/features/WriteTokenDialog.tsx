import { useState } from "react"
import { setWriteToken, clearWriteToken, getWriteToken } from "../../services/api/writeToken.js"
import { useI18n } from "../../i18n/useI18n.js"
import Dialog from "../ui/Dialog.js"

interface WriteTokenDialogProps {
    open: boolean
    onClose: () => void
}

export default function WriteTokenDialog({ open, onClose }: WriteTokenDialogProps) {
    const { t } = useI18n()
    const [token, setToken] = useState(() => getWriteToken() ?? "")
    const [saved, setSaved] = useState(false)

    function handleSave() {
        if (token.trim()) {
            setWriteToken(token.trim())
        } else {
            clearWriteToken()
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    function handleClear() {
        setToken("")
        clearWriteToken()
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <div className="write-token-dialog">
                <h2 className="write-token-title">{t.writeToken.title}</h2>
                <p className="write-token-description">{t.writeToken.description}</p>
                <input
                    type="password"
                    className="write-token-input"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={t.writeToken.placeholder}
                />
                <div className="write-token-actions">
                    <button className="btn" onClick={handleSave}>
                        {t.writeToken.save}
                    </button>
                    <button className="btn btn--secondary" onClick={handleClear}>
                        {t.writeToken.clear}
                    </button>
                </div>
                {saved && <span className="write-token-saved">{t.writeToken.saved}</span>}
            </div>
        </Dialog>
    )
}
