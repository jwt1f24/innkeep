export default function Input({ label, className = "", ...props }) {
    return (
        <div>
            {label && <label className="block text-black text-base mb-1">{label}</label>}
            <input
                className={`w-full p-2 bg-neutral-100 border border-neutral-300 text-black ${className}`}
                {...props}
            />
        </div>
    )
}