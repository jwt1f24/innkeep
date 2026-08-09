import { Monitor } from 'lucide-react'

export default function MobileBlock() {
    return (
        <div className="lg:hidden fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center text-center p-6">
            <Monitor className="w-16 h-16 text-neutral-400 mb-4"/>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Change Display Size</h1>
            <p className="text-neutral-600 max-w-sm">
                Innkeep is currently optimized for desktop screens. Please view this site on a larger display for the best experience.
            </p>
        </div>
    )
}