export default function Button({ variant = "amber", className = "", children, ...props }) {
    const variants = {
        amber: "bg-amber-600 text-white hover:bg-amber-700",
        outline: "bg-transparent border-2 border-slate-600 text-slate-600 hover:bg-slate-600 hover:text-white",
        danger: "bg-red-500 text-white hover:bg-red-600",
        neutral: "bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
    }

    return (
        <button
            className={`${variants[variant]} text-lg font-semibold transition-colors cursor-pointer ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}