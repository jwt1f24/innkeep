import { BASE_URL } from '../api/client'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, Search, ShoppingCart, X, Frown, Clock, Users } from 'lucide-react'
import { useAuth } from '../AuthContext'
import Button from '../components/Button'

const FALLBACK_IMAGE = `${BASE_URL}/static/placeholder.jpg`

export default function BookRoom() {
    const [searchParams] = useSearchParams()
    const { isLoggedIn } = useAuth()
    const navigate = useNavigate()

    const today = new Date().toISOString().split("T")[0]
    const tomorrowDate = new Date()
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrow = tomorrowDate.toISOString().split("T")[0]

    const [checkIn, setCheckIn] = useState(searchParams.get("check_in") || today)
    const [checkOut, setCheckOut] = useState(searchParams.get("check_out") || tomorrow)

    const [searched, setSearched] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [availableTypes, setAvailableTypes] = useState([])

    const [cart, setCart] = useState([])
    const [quoteTotal, setQuoteTotal] = useState(null)
    const [quoteLoading, setQuoteLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")
        setLoading(true)
        setSearched(true)
        setCart([])

        try {
            const typesRes = await fetch(`${BASE_URL}/room-types/`)
            if (!typesRes.ok) throw new Error("Failed to load room types")
            const allTypes = await typesRes.json()

            const imagesRes = await fetch(`${BASE_URL}/room-images/`)
            const allImages = imagesRes.ok ? await imagesRes.json() : []

            const results = await Promise.all(
                allTypes.map(async (rt) => {
                    const params = new URLSearchParams({
                        room_type_id: rt.id,
                        check_in: checkIn,
                        check_out: checkOut,
                    })
                    const res = await fetch(`${BASE_URL}/rooms/available?${params.toString()}`)
                    const rooms = res.ok ? await res.json() : []
                    const image = allImages.find((img) => img.room_type_id === rt.id)
                    return { ...rt, availableCount: rooms.length, image_url: image ? image.image_url : FALLBACK_IMAGE }
                })
            )
            setAvailableTypes(results.filter((rt) => rt.availableCount > 0))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function getCartQuantity(roomTypeId) {
        const item = cart.find((c) => c.roomTypeId === roomTypeId)
        return item ? item.quantity : 0
    }

    function updateQuantity(roomType, delta) {
        setCart((prev) => {
            const existing = prev.find((c) => c.roomTypeId === roomType.id)
            const currentQty = existing ? existing.quantity : 0
            const newQty = Math.max(0, Math.min(roomType.availableCount, currentQty + delta))

            if (newQty === 0) return prev.filter((c) => c.roomTypeId !== roomType.id)
            if (existing) return prev.map((c) => c.roomTypeId === roomType.id ? { ...c, quantity: newQty } : c)
            return [...prev, { roomTypeId: roomType.id, quantity: newQty, roomType }]
        })
    }

    function removeFromCart(roomTypeId) {
        setCart((prev) => prev.filter((c) => c.roomTypeId !== roomTypeId))
    }

    useEffect(() => {
        if (cart.length === 0) {
            setQuoteTotal(null)
            return
        }
        async function loadQuote() {
            setQuoteLoading(true)
            try {
                const res = await fetch(`${BASE_URL}/bookings/quote-multi`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: cart.map((c) => ({ room_type_id: c.roomTypeId, quantity: c.quantity })),
                        check_in: checkIn,
                        check_out: checkOut,
                    }),
                })
                if (!res.ok) throw new Error("Failed to calculate price")
                setQuoteTotal(await res.json())
            } catch (err) {
                setError(err.message)
            } finally {
                setQuoteLoading(false)
            }
        }
        loadQuote()
    }, [cart, checkIn, checkOut])

    function handleContinue() {
        const params = new URLSearchParams({
            check_in: checkIn,
            check_out: checkOut,
            items: JSON.stringify(cart.map((c) => ({ room_type_id: c.roomTypeId, quantity: c.quantity }))),
        })
        if (!isLoggedIn) {
            navigate("/login", { state: { from: { pathname: "/confirm-booking", search: `?${params.toString()}` } } })
            return
        }
        navigate(`/confirm-booking?${params.toString()}`)
    }

    const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))

    return (
        <div>
            {/* header section */}
            <div className="bg-cyan-900 text-center py-16">
                <h1 className="text-4xl text-white font-semibold mb-8">Book a Room</h1>

                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-neutral-800 p-6 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-white text-base font-medium mb-1">Check-in</label>
                        <input type="date" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} className="w-full p-2 bg-white text-black text-lg"/>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-white text-base font-medium mb-1">Check-out</label>
                        <input type="date" value={checkOut} min={tomorrow} onChange={(e) => setCheckOut(e.target.value)} className="w-full p-2 bg-white text-black text-lg"/>
                    </div>
                    <Button type="submit" className="px-4 py-2 w-full md:w-auto">
                        Check Availability
                    </Button>
                    <Button type="button" onClick={() => navigate("/events")} className="px-6 py-2 w-full md:w-auto flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 flex-none" />
                        Events
                    </Button>
                </form>
            </div>

            {/* results section */}
            <div className="py-8">
                <div className="max-w-5xl mx-auto bg-white p-8 flex flex-col lg:flex-row gap-6 items-start shadow-2xl">
                    {/* left side - room list */}
                    <div className="flex-1 min-h-[48rem] max-h-[64rem] overflow-y-auto pr-2">
                        {!searched ? (
                            <div className="flex flex-col items-center justify-center text-center py-24 text-neutral-400">
                                <Search className="w-12 h-12 mb-4" />
                                <p className="text-lg">Select your dates to see available rooms.</p>
                            </div>
                        ) : loading ? (
                            <div className="flex flex-col items-center justify-center text-center py-24 text-neutral-400">
                                <Clock className="w-12 h-12 mb-4" />
                                <p className="text-lg">Checking availability...</p>
                            </div>
                        ) : availableTypes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-24 text-neutral-400">
                                <Frown className="w-12 h-12 mb-4" />
                                <p className="text-lg">No rooms available for these dates.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {availableTypes.map((rt) => (
                                    <div key={rt.id} className="relative border border-neutral-300 overflow-hidden flex flex-col md:flex-row">
                                        <div className="h-32 md:h-auto md:w-40 flex-none bg-cover bg-center" style={{ backgroundImage: `url(${rt.image_url})` }} />

                                        <div className="p-4 flex-1 flex flex-col justify-between gap-3 relative">
                                            <span className="absolute top-3 right-3 bg-neutral-500 text-white text-sm font-medium px-2.5 py-1 rounded-full">
                                                {rt.availableCount} left
                                            </span>

                                            <div>
                                                <p className="text-neutral-900 text-lg font-semibold pr-16">{rt.name}</p>
                                                <div className="flex gap-3 text-neutral-800 text-base mt-1">
                                                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {rt.accommodates}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-end justify-between gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex justify-between gap-6 text-base">
                                                        <span className="text-neutral-800">Weekday</span>
                                                        <span className="text-black font-medium">RM{Number(rt.weekday_price).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-6 text-base">
                                                        <span className="text-neutral-800">Weekend</span>
                                                        <span className="text-black font-medium">RM{Number(rt.weekend_price).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-6 text-base">
                                                        <span className="text-neutral-800">Holiday</span>
                                                        <span className="text-black font-medium">RM{Number(rt.holiday_price).toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <Button onClick={() => updateQuantity(rt, 1)} className="px-4 py-2 flex-none">
                                                    Add Room
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* right side - cart */}
                    <div className="w-full lg:w-80 flex-none">
                        <div className="border border-neutral-300 p-5 h-[64rem] overflow-y-auto">
                            <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5"/> Your Bookings
                            </h2>

                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center py-10 text-neutral-400">
                                    <ShoppingCart className="w-8 h-8 mb-2" />
                                    <p className="text-sm">No rooms selected</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-800 font-medium">Dates</span>
                                            <span className="text-neutral-800">{checkIn} - {checkOut}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-1">
                                            <span className="text-neutral-800 font-medium">Nights</span>
                                            <span className="text-neutral-800">{nights}</span>
                                        </div>
                                    </div>
                                    <div className="border-t border-neutral-200 mb-4" />
                                    <div className="flex flex-col gap-3 mb-4">
                                        {cart.map((item) => {
                                            const result = quoteTotal?.items.find((q) => q.room_type_id === item.roomTypeId)
                                            return (
                                                <div key={item.roomTypeId} className="flex items-start justify-between text-sm">
                                                    <div>
                                                        <p className="text-neutral-800 font-medium">{item.roomType.name} × {item.quantity}</p>
                                                        <p className="text-neutral-800">RM{result?.subtotal ?? "..."}</p>
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.roomTypeId)} className="text-neutral-400 hover:text-red-500 cursor-pointer">
                                                        <X className="w-4 h-4" strokeWidth={2.5}/>
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="border-t border-neutral-200 pt-3 mb-4">
                                        <div className="flex justify-between text-neutral-900 font-bold">
                                            <span>Total</span>
                                            <span>{quoteLoading ? "..." : `RM${quoteTotal?.grand_total ?? 0}`}</span>
                                        </div>
                                    </div>
                                    <Button onClick={handleContinue} className="w-full py-2">
                                        Continue
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* error message */}
                    <p className="text-red-500 text-base min-h-[20px] text-center mt-4">{error}</p>
                </div>
            </div>
        </div>
    )
}