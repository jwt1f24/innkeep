import { useState, useEffect } from 'react'
import { apiFetch } from '../api/client'

export default function Home() {
    const [roomTypes, setRoomTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadRoomTypes() {
            try {
                const data = await apiFetch("/room-types/")
                setRoomTypes(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadRoomTypes()
    }, [])

    if (loading) {
        return <p className='text-white p-6'>Loading rooms...</p>
    }

    if (error) {
        return <p className='text-red-400 p-6'>Error: {error}</p>
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-indigo-400 mb-6">Available Rooms</h1>

            {roomTypes.length === 0 ? (
                <p className="text-slate-400">No room types available yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {roomTypes.map((roomType) => (
                        <div key={roomType.id} className="bg-slate-800 p-5 rounded-xl shadow-lg">
                            <h2 className="text-xl font-semibold text-white mb-2">{roomType.name}</h2>
                            <p className="text-slate-400 text-sm mb-1">Sleeps up to {roomType.accommodates}</p>
                            <p className="text-slate-300 text-sm">Weekday: ${roomType.weekday_price}</p>
                            <p className="text-slate-300 text-sm">Weekend: ${roomType.weekend_price}</p>
                            <p className="text-slate-300 text-sm">Holiday: ${roomType.holiday_price}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}