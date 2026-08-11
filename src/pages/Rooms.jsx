import { BASE_URL } from '../api/client'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BedDouble, Users, Frown, Clock, SearchX } from 'lucide-react'
import RoomCarousel from '../components/RoomCarousel'
import Button from '../components/Button'

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
                    fetch(`${BASE_URL}/room-types/`),
                    fetch(`${BASE_URL}/room-images/`),
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

    // room type display edge case
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-24 text-black">
                <Clock className="w-12 h-12 mb-4"/>
                <p className="text-lg">Loading rooms...</p>
            </div>
        )
    }
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-24 text-red-500">
                <SearchX className="w-12 h-12 mb-4"/>
                <p className="text-lg">{error}</p>
            </div>
        )
    }

    return (
        <div className="pb-24">
            <div className="bg-cyan-900 text-center mb-5 py-16">
                <h1 className="text-white text-4xl font-semibold mb-3">Our Rooms</h1>
                <p className="text-neutral-100 text-lg max-w-2xl mx-auto">
                    Experience our luxurious, well-equipped rooms and suites, each designed for your comfort.
                </p>
            </div>

            {/* existential condition for room types */}
            {roomTypes.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-24 text-black">
                    <Frown className="w-12 h-12 mb-4" />
                    <p className="text-lg">No rooms available right now. Please check back soon.</p>
                </div>
            ) : (
                <div className="max-w-5xl mx-auto flex flex-col gap-10 px-6 py-6">
                    {roomTypes.map((room) => (
                        <div key={room.id} className="bg-white p-6 flex flex-col md:flex-row gap-6 shadow-xl">
                            <div className="flex-1 flex flex-col">
                                <h2 className="text-black text-3xl font-semibold mb-2">{room.name}</h2>
                                <p className="text-neutral-800 text-base mb-4">{room.description}</p>

                                <div className="flex gap-4 text-neutral-800 text-base mb-6">
                                    <span className="flex items-center gap-1.5">
                                        <BedDouble className="w-4 h-4"/>
                                        {describeBeds(room)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4"/>
                                        {room.accommodates}
                                    </span>
                                </div>

                                <div className="flex gap-8 mb-3">
                                    <div>
                                        <p className="text-neutral-800 text-sm font-semibold mb-1">Weekdays</p>
                                        <p className="text-black">
                                            <span className="text-2xl font-semibold">RM{room.weekday_price}</span>{" "}
                                            <span className="text-sm">/night</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-800 text-sm font-semibold mb-1">Weekends</p>
                                        <p className="text-black">
                                            <span className="text-2xl font-semibold">RM{room.weekend_price}</span>{" "}
                                            <span className="text-sm">/night</span>
                                        </p>                                
                                    </div>
                                    <div>
                                        <p className="text-neutral-800 text-sm font-semibold mb-1">Holidays/Peak Season</p>
                                        <p className="text-black">
                                            <span className="text-2xl font-semibold">RM{room.holiday_price}</span>{" "}
                                            <span className="text-sm">/night</span>
                                        </p>  
                                    </div>
                                </div>

                                <Button onClick={() => navigate("/book-room")} className="mt-auto py-3 px-6">
                                    BOOK NOW
                                </Button>
                            </div>

                            <div className="w-full md:w-80 h-72 flex-none">
                                <RoomCarousel images={imagesByRoomType[room.id] || []} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}