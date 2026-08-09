export default function AdminModal({ open, title, onClose, children }) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-black">{title}</h2>
                    <button onClick={onClose} className="text-neutral-600 hover:text-black cursor-pointer">✕</button>
                </div>
                {children}
            </div>
        </div>
    )
}