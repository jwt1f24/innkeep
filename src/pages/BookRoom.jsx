import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '../AuthContext'

export default function BookRoom() {
    const [roomTypes, setRoomTypes] = useState([])
    const [availableRooms, setAvailableRooms] = useState([])
    const [loadingRoomTypes, setLoadingRoomTypes] = useState(true)
    const [loadingAvailability, setLoadingAvailability] = useState(false)
    const [error, setError] = useState("")

    const [searchParams] = useSearchParams()
    const { isLoggedIn } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const today = new Date().toISOString().split("T")[0]
    const tomorrowDate = new Date()
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrow = tomorrowDate.toISOString().split("T")[0]

    const [roomTypeId, setRoomTypeId] = useState(searchParams.get("room_type_id") || "")
    const [checkIn, setCheckIn] = useState(today)
    const [checkOut, setCheckOut] = useState(tomorrow)
    const [roomId, setRoomId] = useState("")

    // load room types once
    useEffect(() => {
        async function loadRoomTypes() {
            try {
                const res = await fetch("http://localhost:8000/room-types/")
                if (!res.ok) throw new Error("Failed to load room types")
                const data = await res.json()
                setRoomTypes(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoadingRoomTypes(false)
            }
        }
        loadRoomTypes()
    }, [])

    // load available rooms whenever room type or dates change
    useEffect(() => {
        setRoomId("")
        setAvailableRooms([])

        if (!roomTypeId || !checkIn || !checkOut) return
        if (checkOut <= checkIn) return

        async function loadAvailability() {
            setLoadingAvailability(true)
            try {
                const params = new URLSearchParams({
                    room_type_id: roomTypeId,
                    check_in: checkIn,
                    check_out: checkOut,
                })
                const res = await fetch(`http://localhost:8000/rooms/available?${params.toString()}`)
                if (!res.ok) throw new Error("Failed to check availability")
                const data = await res.json()
                setAvailableRooms(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoadingAvailability(false)
            }
        }
        loadAvailability()
    }, [roomTypeId, checkIn, checkOut])

    function handleSubmit(e) {
        e.preventDefault()
        setError("")

        if (!roomTypeId) {
            setError("Please select a room type.")
            return
        }
        if (checkOut <= checkIn) {
            setError("Check-out must be after check-in.")
            return
        }
        if (!roomId) {
            setError("Please select an available room.")
            return
        }

        const params = new URLSearchParams({
            room_id: roomId,
            check_in: checkIn,
            check_out: checkOut,
        })
        const confirmPath = `/confirm-booking?${params.toString()}`

        if (!isLoggedIn) {
            navigate("/login", { state: { from: { pathname: "/confirm-booking", search: `?${params.toString()}` } } })
            return
        }

        navigate(confirmPath)
    }

    if (loadingRoomTypes) {
        return <p className="text-white p-6">Loading...</p>
    }

    return (
        <div className="max-w-2xl mx-auto p-6 mt-6">
            <h1 className="text-4xl font-bold text-white mb-3 text-center">Book a Room</h1>

            <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
                <div>
                    <label className="block text-slate-400 text-sm mb-1">Room Type</label>
                    <div className="relative">
                        <select
                            value={roomTypeId}
                            onChange={(e) => setRoomTypeId(e.target.value)}
                            className="w-full p-2 pr-8 rounded bg-slate-700 text-white cursor-pointer appearance-none"
                        >
                            <option value="" disabled hidden>Select a room type</option>
                            {roomTypes.map((room_type) => (
                                <option key={room_type.id} value={room_type.id}>{room_type.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-slate-400 text-m mb-1">Check-in</label>
                        <input
                            type="date"
                            value={checkIn}
                            min={today}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="w-full p-2 rounded bg-slate-700 text-white cursor-pointer"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-slate-400 text-m mb-1">Check-out</label>
                        <input
                            type="date"
                            value={checkOut}
                            min={tomorrow}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="w-full p-2 rounded bg-slate-700 text-white cursor-pointer"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-slate-400 text-m mb-1">Room Number</label>
                    <div className="relative">
                        <select
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            disabled={!roomTypeId || loadingAvailability}
                            className="w-full p-2 pr-8 rounded bg-slate-700 text-white disabled:opacity-50 enabled:cursor-pointer appearance-none"
                        >
                            <option value="">
                                {loadingAvailability
                                    ? "Checking availability..."
                                    : availableRooms.length === 0
                                    ? "No rooms available for these dates"
                                    : "Select a room"}
                            </option>
                            {availableRooms.map((room) => (
                                <option key={room.id} value={room.id}>Room {room.room_number}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <p className="text-red-400 text-sm min-h-[20px]">{error}</p>

                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-medium transition-colors"
                >
                    Continue
                </button>
            </form>
        </div>
    )
}