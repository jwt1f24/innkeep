import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import { BedDouble, Users } from 'lucide-react'

const FALLBACK_IMAGE = "http://localhost:8000/static/placeholder.jpg"

function statusColor(status) {
    if (status === "confirmed") return "text-green-400"
    if (status === "cancelled") return "text-red-400"
    if (status === "completed") return "text-slate-400"
    return "text-yellow-400"
}

export default function MyBookings() {
    const [bookings, setBookings] = useState([])
    const [rooms, setRooms] = useState({})
    const [roomTypes, setRoomTypes] = useState({})
    const [images, setImages] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [actionLoading, setActionLoading] = useState(false)
    const [modal, setModal] = useState(null)

    const { token } = useAuth()
    const today = new Date().toISOString().split("T")[0]

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [bookingsRes, roomsRes, roomTypesRes, imagesRes] = await Promise.all([
                fetch("http://localhost:8000/bookings/", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("http://localhost:8000/rooms/"),
                fetch("http://localhost:8000/room-types/"),
                fetch("http://localhost:8000/room-images/"),
            ])
            if (!bookingsRes.ok) throw new Error("Failed to load bookings")

            const bookingsData = await bookingsRes.json()
            const roomsData = await roomsRes.json()
            const roomTypesData = await roomTypesRes.json()
            const imagesData = await imagesRes.json()

            const roomsById = Object.fromEntries(roomsData.map((r) => [r.id, r]))
            const roomTypesById = Object.fromEntries(roomTypesData.map((rt) => [rt.id, rt]))
            const imageByRoomType = {}
            for (const img of imagesData) {
                if (!imageByRoomType[img.room_type_id]) imageByRoomType[img.room_type_id] = img.image_url
            }

            setRooms(roomsById)
            setRoomTypes(roomTypesById)
            setImages(imageByRoomType)
            setBookings(bookingsData.sort((a, b) => new Date(b.date_created) - new Date(a.date_created)))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleConfirmAction() {
        if (!modal) return
        setActionLoading(true)
        setError("")

        const endpoint = modal.type === "cancel"
            ? `http://localhost:8000/bookings/${modal.booking.id}/cancel`
            : `http://localhost:8000/bookings/${modal.booking.id}/early-checkout`

        try {
            const res = await fetch(endpoint, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "Action failed")
            }
            await loadData()
            setModal(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) {
        return <p className="text-white p-6">Loading your bookings...</p>
    }

    return (
        <div className="max-w-3xl mx-auto p-6 mt-8">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">My Bookings</h1>

            <p className="text-red-400 text-sm min-h-[20px] text-center">{error}</p>

            {bookings.length === 0 ? (
                <p className="text-slate-400 text-center">You have no bookings yet.</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {bookings.map((booking) => {
                        const room = rooms[booking.room_id]
                        const roomType = room ? roomTypes[room.room_type_id] : null
                        const imageUrl = room ? images[room.room_type_id] || FALLBACK_IMAGE : FALLBACK_IMAGE

                        const canCancel = booking.status === "confirmed" && today < booking.check_in
                        const canEarlyCheckout = booking.status === "confirmed" && booking.check_in <= today && today < booking.check_out

                        return (
                            <div key={booking.id} className="bg-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col md:flex-row">
                                <div
                                    className="h-40 md:h-auto md:w-48 flex-none bg-cover bg-center"
                                    style={{ backgroundImage: `url(${imageUrl})` }}
                                />

                                <div className="p-5 flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <p className="text-white font-semibold text-lg">{roomType?.name || "Room"}</p>
                                        <p className="text-slate-400 text-sm mb-2">
                                            Room {room?.room_number}
                                        </p>
                                        <p className="text-slate-300 text-sm">
                                            {booking.check_in} → {booking.check_out}
                                        </p>
                                        <p className="text-slate-400 text-sm">
                                            Total: RM{booking.total_price}
                                        </p>
                                        <p className={`text-sm font-medium capitalize ${statusColor(booking.status)}`}>
                                            {booking.status}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2 flex-none">
                                        {canCancel && (
                                            <button
                                                onClick={() => setModal({ type: "cancel", booking })}
                                                className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded font-medium transition-colors"
                                            >
                                                Cancel Booking
                                            </button>
                                        )}
                                        {canEarlyCheckout && (
                                            <button
                                                onClick={() => setModal({ type: "early-checkout", booking })}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded font-medium transition-colors"
                                            >
                                                Early Checkout
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <ConfirmModal
                open={modal !== null}
                title={modal?.type === "cancel" ? "Cancel this booking?" : "Check out early?"}
                message={
                    modal?.type === "cancel"
                        ? "This will cancel your booking and refund your payment. This cannot be undone."
                        : "You will be charged a 10% fee on the remaining unstayed nights, and your stay will end today."
                }
                onConfirm={handleConfirmAction}
                onCancel={() => setModal(null)}
                loading={actionLoading}
            />
        </div>
    )
}