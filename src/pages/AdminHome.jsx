import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminHome() {
    const [stats, setStats] = useState(null)
    const [chartData, setChartData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [metric, setMetric] = useState("revenue")
    const { token } = useAuth()

    useEffect(() => {
        loadStats()
    }, [token])

    async function loadStats() {
        setLoading(true)
        try {
            const [roomTypesRes, roomsRes, bookingsRes, usersRes] = await Promise.all([
                fetch("http://localhost:8000/room-types/"),
                fetch("http://localhost:8000/rooms/"),
                fetch("http://localhost:8000/bookings/", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("http://localhost:8000/users/", { headers: { Authorization: `Bearer ${token}` } }),
            ])
            if (!roomTypesRes.ok || !roomsRes.ok || !bookingsRes.ok || !usersRes.ok) {
                throw new Error("Failed to load overview data")
            }

            const roomTypes = await roomTypesRes.json()
            const rooms = await roomsRes.json()
            const bookings = await bookingsRes.json()
            const users = await usersRes.json()

            const nonCancelled = bookings.filter((b) => b.status !== "cancelled")
            const confirmedBookings = bookings.filter((b) => b.status === "confirmed")
            const prices = nonCancelled.map((b) => Number(b.total_price))
            const totalRevenue = prices.reduce((sum, p) => sum + p, 0)

            setStats({
                roomTypeCount: roomTypes.length,
                roomCount: rooms.length,
                bookingCount: bookings.length,
                confirmedCount: confirmedBookings.length,
                userCount: users.length,
                totalRevenue: totalRevenue.toFixed(2),
                averageRevenue: prices.length > 0 ? (totalRevenue / prices.length).toFixed(2) : "0.00",
                highestRevenue: prices.length > 0 ? Math.max(...prices).toFixed(2) : "0.00",
                lowestRevenue: prices.length > 0 ? Math.min(...prices).toFixed(2) : "0.00",
            })

            // chart data during the last 30 days
            const days = []
            for (let i = 29; i >= 0; i--) {
                const d = new Date()
                d.setDate(d.getDate() - i)
                days.push(d.toISOString().split("T")[0])
            }

            const dailyData = days.map((day) => {
                const dayBookings = nonCancelled.filter((b) => b.date_created.startsWith(day))
                return {
                    date: day.slice(5),
                    revenue: Number(dayBookings.reduce((sum, b) => sum + Number(b.total_price), 0).toFixed(2)),
                    bookings: dayBookings.length,
                }
            })
            setChartData(dailyData)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <p className="text-neutral-600 px-6">Loading...</p>
    if (error) return <p className="text-red-500 px-6">{error}</p>

    const cards = [
        { label: "Room Types", value: stats.roomTypeCount },
        { label: "Rooms", value: stats.roomCount },
        { label: "Total Bookings", value: stats.bookingCount },
        { label: "Active Bookings", value: stats.confirmedCount },
        { label: "Users", value: stats.userCount },
        { label: "Total Revenue", value: `RM${stats.totalRevenue}` },
    ]

    const revenueStats = [
        { label: "Average Booking Revenue", value: `RM${stats.averageRevenue}` },
        { label: "Highest Booking Revenue", value: `RM${stats.highestRevenue}` },
        { label: "Lowest Booking Revenue", value: `RM${stats.lowestRevenue}` },
    ]

    return (
        <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-semibold text-black mb-6">Overview</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white border border-neutral-300 rounded-xl p-5">
                        <p className="text-neutral-800 text-base mb-1">{card.label}</p>
                        <p className="text-black text-2xl font-semibold">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="border-t border-neutral-300 mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {revenueStats.map((card) => (
                    <div key={card.label} className="bg-white border border-neutral-300 rounded-xl p-5">
                        <p className="text-neutral-800 text-base mb-1">{card.label}</p>
                        <p className="text-black text-2xl font-semibold">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* chart section */}
            <div className="bg-white border border-neutral-300 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-black text-base font-semibold">Last 30 Days</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMetric("revenue")}
                            className={`px-4 py-2 rounded text-base font-medium cursor-pointer transition-colors ${
                                metric === "revenue" ? "bg-amber-600 text-white" : "text-neutral-600 hover:bg-neutral-200"
                            }`}
                        >
                            Revenue
                        </button>
                        <button
                            onClick={() => setMetric("bookings")}
                            className={`px-4 py-2 rounded text-base font-medium cursor-pointer transition-colors ${
                                metric === "bookings" ? "bg-cyan-900 text-white" : "text-neutral-600 hover:bg-neutral-200"
                            }`}
                        >
                            Bookings
                        </button>
                    </div>
                </div>

                {/* chart grid */}
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="date" tick={{ fontSize: 14, fill: "#303030" }} />
                        <YAxis tick={{ fontSize: 14, fill: "#303030" }} />
                        <Tooltip 
                            formatter={(value, name) => {
                                if (name === "Revenue (RM)") return [`RM${Number(value).toFixed(2)}`, name]
                                return [value, name]
                            }}
                        />
                        {metric === "revenue" ? (
                            <Line type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2} name="Revenue (RM)" isAnimationActive={false}/>
                        ) : (
                            <Line type="monotone" dataKey="bookings" stroke="#164e63" strokeWidth={2} name="Bookings" isAnimationActive={false}/>
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}