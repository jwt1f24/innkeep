import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BedDouble, Users } from 'lucide-react'
import RoomCarousel from '../components/RoomCarousel'

function describeBeds(room) {
    const parts = []
    if (room.king_beds > 0) parts.push(`${room.king_beds} King`)
    if (room.queen_beds > 0) parts.push(`${room.queen_beds} Queen`)
    if (room.single_beds > 0) parts.push(`${room.single_beds} Single`)
    return parts.length > 0 ? parts.join(", ") : "No beds listed"
}

export default function Rooms() {
    const [roomTypes, setRoomTypes] = useState([])
    const [imagesByRoomType, setImagesByRoomType] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const navigate = useNavigate()

    useEffect(() => {
        async function loadData() {
            try {
                const [typesRes, imagesRes] = await Promise.all([
                    fetch("http://localhost:8000/room-types/"),
                    fetch("http://localhost:8000/room-images/"),
                ])
                if (!typesRes.ok || !imagesRes.ok) throw new Error("Failed to load rooms")

                const types = await typesRes.json()
                const images = await imagesRes.json()

                const grouped = {}
                for (const img of images) {
                    if (!grouped[img.room_type_id]) grouped[img.room_type_id] = []
                    grouped[img.room_type_id].push(img)
                }

                const sorted = [...types].sort((a, b) => a.id - b.id)

                setRoomTypes(sorted)
                setImagesByRoomType(grouped)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading) return <p className="text-white p-6">Loading rooms...</p>
    if (error) return <p className="text-red-400 p-6">Error: {error}</p>

    return (
        <div>
            <div className="text-center py-12 px-6">
                <h1 className="text-4xl font-bold text-indigo-400 mb-3">Rooms</h1>
                <p className="text-slate-300 max-w-2xl mx-auto">
                    Experience six different types of luxurious, well-equipped rooms and suites, each designed for your comfort.
                </p>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col gap-10">
                {roomTypes.map((room) => (
                    <div
                        key={room.id}
                        className="bg-slate-800 p-6 flex flex-col md:flex-row gap-6 shadow-lg"
                    >
                        <div className="flex-1 flex flex-col">
                            <h2 className="text-3xl font-bold text-white mb-2">{room.name}</h2>
                            <p className="text-slate-400 text-m mb-4">{room.description}</p>

                            <div className="flex gap-4 text-slate-300 text-m mb-6">
                                <span className="flex items-center gap-1.5">
                                    <BedDouble className="w-4 h-4" />
                                    {describeBeds(room)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4" />
                                    {room.accommodates}
                                </span>
                            </div>

                            <div className="flex gap-8 mb-3">
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Weekdays</p>
                                    <p className="text-white font-semibold">
                                        <span className="text-2xl">RM{room.weekday_price}</span>{" "}
                                        <span className="text-slate-400 text-sm">/night</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Weekends</p>
                                    <p className="text-white font-semibold">
                                        <span className="text-2xl">RM{room.weekend_price}</span>{" "}
                                        <span className="text-slate-400 text-sm">/night</span>
                                    </p>                                
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Holidays/Peak Season</p>
                                    <p className="text-white font-semibold">
                                        <span className="text-2xl">RM{room.holiday_price}</span>{" "}
                                        <span className="text-slate-400 text-sm">/night</span>
                                    </p>  
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/rooms/${room.id}`)}
                                className="mt-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xl py-3 px-6 font-medium transition-colors"
                            >
                                Book Now
                            </button>
                        </div>

                        <div className="w-full md:w-80 h-72 flex-none">
                            <RoomCarousel images={imagesByRoomType[room.id] || []} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}