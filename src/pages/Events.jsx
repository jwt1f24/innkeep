import { BASE_URL } from '../api/client'
import { useState, useEffect } from 'react'
import { Calendar, Frown, Clock } from 'lucide-react'

export default function Events() {
    const [rules, setRules] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        loadRules()
    }, [])

    async function loadRules() {
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/pricing/`)
            if (!res.ok) throw new Error("Failed to load events")
            const data = await res.json()
            setRules(data.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-24 text-neutral-400">
                <Clock className="w-12 h-12 mb-4" />
                <p className="text-lg">Loading events...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-24 text-red-500">
                <p className="text-lg">Error: {error}</p>
            </div>
        )
    }

    return (
        <div className="pb-24">
            <div className="bg-cyan-900 text-center mb-5 py-16">
                <h1 className="text-white text-4xl font-semibold mb-3">Upcoming Events & Peak Periods</h1>
                <p className="text-neutral-100 text-lg max-w-2xl mx-auto">
                    Booking prices may increase during holiday and peak season periods. Check the dates below when planning your stay.
                </p>
            </div>

            <div className="max-w-3xl mx-auto px-6">
                {rules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-24 text-base">
                        <Frown className="w-12 h-12 mb-4" />
                        <p className="text-lg">No upcoming peak periods scheduled right now.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-10 py-6">
                        {rules.map((rule) => (
                            <div key={rule.id} className="bg-white p-10 flex items-center gap-4 shadow-xl">
                                <div className="w-16 h-16 flex flex-none items-center justify-center bg-cyan-900 rounded-full">
                                    <Calendar className="w-8 h-8 text-amber-100" />
                                </div>
                                <div className="text-black text-lg">
                                    <p className="font-semibold">{rule.label}</p>
                                    <p>{rule.start_date} - {rule.end_date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}