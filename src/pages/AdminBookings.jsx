import { BASE_URL } from '../api/client'
import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import Button from '../components/Button'

function statusColor(status) {
    if (status === "confirmed") return "text-green-600"
    if (status === "cancelled") return "text-red-600"
    if (status === "completed") return "text-neutral-500"
    return "text-amber-600"
}

export default function AdminBookings() {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const { token } = useAuth()
    const [modal, setModal] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)
    const today = new Date().toISOString().split("T")[0]
    const [filterStatus, setFilterStatus] = useState("")

    const filteredBookings = filterStatus
        ? bookings.filter((b) => b.status === filterStatus)
        : bookings

    useEffect(() => {
        loadBookings()
    }, [token])

    async function loadBookings() {
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/bookings/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error("Failed to load bookings")
            const data = await res.json()
            setBookings(data.sort((a, b) => new Date(b.date_created) - new Date(a.date_created)))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleConfirmAction() {
        if (!modal) return
        setActionLoading(true)
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
            await loadBookings()
            setModal(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return <p className="text-neutral-600">Loading...</p>

    return (
        <div>
            <div className="flex items-center gap-6 mb-4">
                <h2 className="text-black text-4xl font-semibold">Bookings</h2>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 rounded bg-white border border-neutral-300 text-black text-base"
                >
                    <option value="">All</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            <p className="text-red-500 text-base min-h-[20px]">{error}</p>

            <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-black border-b border-neutral-300 bg-neutral-50">
                            <th className="py-3 px-4">Booking ID</th>
                            <th className="py-3 px-4">User ID</th>
                            <th className="py-3 px-4">Room ID</th>
                            <th className="py-3 px-4">Check-in</th>
                            <th className="py-3 px-4">Check-out</th>
                            <th className="py-3 px-4">Total Price</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.map((booking) => {
                            const canCancel = booking.status === "confirmed" && today < booking.check_in
                            const canEarlyCheckout = booking.status === "confirmed" && booking.check_in <= today && today < booking.check_out
                            return (
                                <tr key={booking.id} className="border-b border-neutral-100 text-black last:border-0">
                                    <td className="py-3 px-4">{booking.id}</td>
                                    <td className="py-3 px-4">{booking.user_id}</td>
                                    <td className="py-3 px-4">{booking.room_id}</td>
                                    <td className="py-3 px-4">{booking.check_in}</td>
                                    <td className="py-3 px-4">{booking.check_out}</td>
                                    <td className="py-3 px-4">RM{Number(booking.total_price).toFixed(2)}</td>
                                    <td className={`py-3 px-4 capitalize font-medium ${statusColor(booking.status)}`}>
                                        {booking.status}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-2">
                                            {canCancel && (
                                                <Button
                                                    variant="danger"
                                                    onClick={() => setModal({ type: "cancel", booking })}
                                                    className="px-4 py-1 rounded text-sm"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                            {canEarlyCheckout && (
                                                <Button
                                                    onClick={() => setModal({ type: "early-checkout", booking })}
                                                    className="px-4 py-1 rounded text-sm"
                                                >
                                                    Early Checkout
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                open={modal !== null}
                title={modal?.type === "cancel" ? "Cancel this booking?" : "Check out early?"}
                message={
                    modal?.type === "cancel"
                        ? "This will cancel the booking and refund the payment."
                        : "This will end the stay today and apply the early-checkout penalty."
                }
                onConfirm={handleConfirmAction}
                onCancel={() => setModal(null)}
                loading={actionLoading}
            />
        </div>
    )
}