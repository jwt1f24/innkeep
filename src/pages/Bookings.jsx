import { BASE_URL } from '../api/client'
import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { BedDouble, Users, Clock, Frown } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import Button from '../components/Button'

const FALLBACK_IMAGE = `${BASE_URL}/static/placeholder.jpg`

function statusColor(status) {
    if (status === "confirmed") return "text-green-600"
    if (status === "cancelled") return "text-red-600"
    return "text-neutral-800"
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
                fetch(`${BASE_URL}/bookings/`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${BASE_URL}/rooms/`),
                fetch(`${BASE_URL}/room-types/`),
                fetch(`${BASE_URL}/room-images/`),
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
            ? `${BASE_URL}/bookings/${modal.booking.id}/cancel`
            : `${BASE_URL}/bookings/${modal.booking.id}/early-checkout`

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

    // booking display edge case
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-24 text-black">
                <Clock className="w-12 h-12 mb-4"/>
                <p className="text-lg">Loading your bookings...</p>
            </div>
        )
    }

    return (
        <div className="pb-24">
            <div className="bg-cyan-900 text-center mb-5 py-16">
                <h1 className="text-white text-4xl font-semibold mb-3">Your Bookings</h1>
                <p className="text-neutral-100 text-lg max-w-2xl mx-auto">
                    Keep track of each and every single one of your past booking details, all in a list of rich history.
                </p>
            </div>

            <p className="text-red-500 text-sm min-h-[20px] text-center">{error}</p>

            {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-24 text-black">
                    <Frown className="w-12 h-12 mb-4" />
                    <p className="text-lg">You have no bookings yet.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-10 px-6 max-w-4xl mx-auto">
                    {bookings.map((booking) => {
                        const room = rooms[booking.room_id]
                        const roomType = room ? roomTypes[room.room_type_id] : null
                        const imageUrl = room ? images[room.room_type_id] || FALLBACK_IMAGE : FALLBACK_IMAGE

                        const canCancel = booking.status === "confirmed" && today < booking.check_in
                        const canEarlyCheckout = booking.status === "confirmed" && booking.check_in <= today && today < booking.check_out

                        return (
                            <div key={booking.id} className="bg-white overflow-hidden shadow-xl flex flex-col md:flex-row">
                                <div
                                    className="h-40 md:h-auto md:w-48 flex-none bg-cover bg-center"
                                    style={{ backgroundImage: `url(${imageUrl})` }}
                                />

                                <div className="p-5 flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <p className="text-black text-xl font-semibold">
                                            {roomType?.name || "Room"}
                                        </p>
                                        <p className="text-black text-lg mb-4">
                                            Room {room?.room_number}
                                        </p>
                                        <p className="text-neutral-800 text-lg font-semibold">
                                            {booking.check_in} → {booking.check_out}
                                        </p>
                                        <p className="text-neutral-800 text-base font-semibold mb-2">
                                            Total Price: RM{Number(booking.total_price).toFixed(2)}
                                        </p>
                                        <p className={`text-lg font-medium capitalize ${statusColor(booking.status)}`}>
                                            {booking.status}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2 flex-none pr-6">
                                        {canCancel && (
                                            <Button variant="danger" onClick={() => setModal({ type: "cancel", booking })} className="py-4 px-6">
                                                Cancel Booking
                                            </Button>
                                        )}
                                        {canEarlyCheckout && (
                                            <Button onClick={() => setModal({ type: "early-checkout", booking })} className="py-4 px-6">
                                                Early Checkout
                                            </Button>
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