import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Dropdown({ 
    icon: Icon, 
    value, 
    placeholder, 
    options = [], 
    onSelect, 
    className = "" 
}) {
    const [open, setOpen] = useState(false)
    const containerRef = useRef(null)

    // attach listener when dropdown is open
    useEffect(() => {
        if (!open) return

        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
            }
        }

        function handleKeyDown(e) {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleKeyDown)
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [open])

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="listbox"
                className="w-full flex items-center justify-between gap-2 p-3 rounded bg-neutral-50 border border-neutral-400 text-left hover:bg-neutral-100 transition-colors cursor-pointer"
            >
                <span className="flex items-center gap-2 truncate">
                    {Icon && <Icon className="w-5 h-5 text-neutral-500 flex-none" />}
                    <span className={`text-base truncate ${value ? "text-neutral-900" : "text-neutral-500"}`}>
                        {value || placeholder}
                    </span>
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-500 flex-none transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* opened dropdown list */}
            {open && (
                <div 
                    role="listbox"
                    className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded shadow-lg overflow-hidden max-h-60 overflow-y-auto"
                >
                    {options.length === 0 ? (
                        <p className="text-neutral-500 text-sm p-3">No options available.</p>
                    ) : (
                        options.map((opt) => (
                            <button
                                key={opt.id}
                                role="option"
                                aria-selected={value === opt.label}
                                type="button"
                                onClick={() => {
                                    onSelect(opt.id)
                                    setOpen(false)
                                }}
                                className="w-full text-left p-3 text-base text-neutral-900 hover:bg-neutral-100 transition-colors"
                            >
                                {opt.label}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}