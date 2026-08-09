import Button from "./Button"

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirm", loading = false }) {
    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 max-w-sm w-full shadow-xl">
                <h1 className="text-black text-2xl font-bold mb-2">{title}</h1>
                <p className="text-neutral-800 text-base mb-8">{message}</p>

                <div className="flex gap-3">
                    <Button variant="neutral" onClick={onCancel} disabled={loading} className="flex-1 py-2">
                        Go Back
                    </Button>
                    <Button variant="danger" onClick={onConfirm} disabled={loading} className="flex-1 py-2">
                        {loading ? "Processing..." : "Confirm"}
                    </Button>
                </div>
            </div>
        </div>
    )
}