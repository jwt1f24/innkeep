import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ChevronDown, CreditCard, Trash2 } from 'lucide-react'
import { useAuth } from '../AuthContext'
import { stripePromise } from '../stripe'
import ConfirmModal from '../components/ConfirmModal'

const TIMEOUT_SECONDS = 5 * 60

const cardFieldStyle = {
    style: {
        base: {
            color: "#ffffff",
            fontSize: "16px",
            "::placeholder": { color: "#94a3b8" },
        },
    }
}

function PaymentSection({ roomId, checkIn, checkOut, clientSecret, onSuccess }) {
    const stripe = useStripe()
    const elements = useElements()
    const { token } = useAuth()

    const [cards, setCards] = useState([])
    const [loadingCards, setLoadingCards] = useState(true)
    const [selectedMethod, setSelectedMethod] = useState(null)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [addingNew, setAddingNew] = useState(false)

    const [name, setName] = useState("")
    const [postcode, setPostcode] = useState("")
    const [addingCard, setAddingCard] = useState(false)
    const [addError, setAddError] = useState("")

    const [paying, setPaying] = useState(false)
    const [payError, setPayError] = useState("")
    const [justAddedCard, setJustAddedCard] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const postcode_pattern = /^\d{3,10}$/

    useEffect(() => {
        loadCards()
    }, [])

    async function loadCards() {
        setLoadingCards(true)
        try {
            const res = await fetch("http://localhost:8000/stripe/payment-methods", {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error("Failed to load saved cards")
            const data = await res.json()
            setCards(data)
        } catch (err) {
            setPayError(err.message)
        } finally {
            setLoadingCards(false)
        }
    }

    function displayCards() {
        if (justAddedCard && !cards.some((c) => c.id === justAddedCard.id)) {
            return [justAddedCard, ...cards]
        }
        return cards
    }

    async function handleAddCard(e) {
        e.preventDefault()
        if (!stripe || !elements) return

        const postcode_pattern = /^\d{3,10}$/
        if (!postcode_pattern.test(postcode)) {
            setAddError("Postcode must be 3 to 10 digits.")
            return
        }

        setAddingCard(true)
        setAddError("")

        const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: elements.getElement(CardNumberElement),
            billing_details: { name, address: { postal_code: postcode } },
        })

        if (stripeError) {
            setAddError(stripeError.message)
            setAddingCard(false)
            return
        }

        try {
            const attachRes = await fetch(`http://localhost:8000/stripe/attach-payment-method?payment_method_id=${paymentMethod.id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!attachRes.ok) throw new Error("Failed to save card")
        } catch (err) {
            setAddError(err.message)
            setAddingCard(false)
            return
        }

        setSelectedMethod(paymentMethod.id)
        setJustAddedCard({ id: paymentMethod.id, brand: paymentMethod.card.brand, last4: paymentMethod.card.last4 })
        setAddingNew(false)
        setName("")
        setPostcode("")
        setAddingCard(false)
    }

    function requestDeleteCard(cardId, e) {
        e.stopPropagation()
        setDeleteTarget(cardId)
    }

    async function confirmDeleteCard() {
        if (!deleteTarget) return
        setDeleting(true)

        try {
            const res = await fetch(`http://localhost:8000/stripe/payment-methods/${deleteTarget}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error("Failed to remove card")

            if (selectedMethod === deleteTarget) {
                setSelectedMethod(null)
            }
            if (justAddedCard?.id === deleteTarget) {
                setJustAddedCard(null)
            }
            await loadCards()
            setDeleteTarget(null)
        } catch (err) {
            setPayError(err.message)
        } finally {
            setDeleting(false)
        }
    }

    async function handleDeleteCard(cardId, e) {
        e.stopPropagation()

        try {
            const res = await fetch(`http://localhost:8000/stripe/payment-methods/${cardId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) throw new Error("Failed to remove card")

            if (selectedMethod === cardId) {
                setSelectedMethod(null)
            }
            if (justAddedCard?.id === cardId) {
                setJustAddedCard(null)
            }
            await loadCards()
        } catch (err) {
            setPayError(err.message)
        }
    }

    function selectedCard() {
        return displayCards().find((c) => c.id === selectedMethod)
    }

    async function handlePay() {
        if (!stripe || !selectedMethod) return

        setPaying(true)
        setPayError("")

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: selectedMethod,
        })

        if (stripeError) {
            setPayError(stripeError.message)
            setPaying(false)
            return
        }

        if (paymentIntent.status === "succeeded") {
            try {
                const bookingRes = await fetch("http://localhost:8000/bookings/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ room_id: Number(roomId), check_in: checkIn, check_out: checkOut }),
                })
                if (!bookingRes.ok) {
                    const err = await bookingRes.json().catch(() => ({}))
                    throw new Error(err.detail || "Booking failed")
                }
                onSuccess()
                setJustAddedCard(null)
                await loadCards()
            } catch (err) {
                setPayError(err.message)
                setPaying(false)
            }
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div>
                <label className="block text-slate-400 text-sm mb-1">Payment Method</label>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setDropdownOpen((v) => !v)}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded bg-slate-700 text-left hover:bg-slate-600 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-slate-300" />
                            {selectedCard() ? (
                                <span className="text-white text-sm capitalize">
                                    {selectedCard().brand} •••• {selectedCard().last4}
                                </span>
                            ) : (
                                <span className="text-slate-400 text-sm">
                                    {loadingCards ? "Loading..." : "Select a payment method"}
                                </span>
                            )}
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-slate-700 rounded shadow-lg overflow-hidden">
                            {displayCards().length === 0 ? (
                                <p className="text-slate-400 text-sm p-3">No saved cards yet.</p>
                            ) : (
                                displayCards().map((card) => (
                                    <div
                                        key={card.id}
                                        className="flex items-center justify-between hover:bg-slate-600"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedMethod(card.id)
                                                setDropdownOpen(false)
                                            }}
                                            className="flex-1 text-left p-3 text-sm text-white capitalize"
                                        >
                                            {card.brand} •••• {card.last4}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => requestDeleteCard(card.id, e)}
                                            className="p-3 text-slate-400 hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setAddingNew((v) => !v)}
                    className="mt-2 text-indigo-400 hover:underline text-sm"
                >
                    {addingNew ? "Cancel" : "+ Add new card"}
                </button>
            </div>

            {addingNew && (
                <form onSubmit={handleAddCard} className="flex flex-col gap-3 bg-slate-700/50 p-4 rounded-xl">
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Name on card</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full p-2 rounded bg-slate-700 text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Card details</label>
                        <div className="bg-slate-700 rounded">
                            <div className="p-3 border-b border-slate-600">
                                <CardNumberElement options={{ ...cardFieldStyle, disableLink: true }} />
                            </div>
                            <div className="flex">
                                <div className="flex-1 p-3 border-r border-slate-600">
                                    <CardExpiryElement options={cardFieldStyle} />
                                </div>
                                <div className="flex-1 p-3">
                                    <CardCvcElement options={cardFieldStyle} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Billing postcode</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="\d{3,10}"
                            value={postcode}
                            onChange={(e) => setPostcode(e.target.value)}
                            required
                            className="w-full p-2 rounded bg-slate-700 text-white"
                        />
                    </div>

                    <p className="text-red-400 text-sm min-h-[20px]">{addError}</p>

                    <button
                        type="submit"
                        disabled={!stripe || addingCard}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-medium transition-colors disabled:opacity-50"
                    >
                        {addingCard ? "Adding..." : "Add & Use Card"}
                    </button>
                </form>
            )}

            <p className="text-red-400 text-sm min-h-[20px]">{payError}</p>

            <button
                onClick={handlePay}
                disabled={!stripe || !selectedMethod || paying}
                className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-medium transition-colors disabled:opacity-50"
            >
                {paying ? "Processing..." : "Pay Now"}
            </button>

            <ConfirmModal
                open={deleteTarget !== null}
                title="Remove this card?"
                message="This payment method will be permanently removed from your account."
                onConfirm={confirmDeleteCard}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
            />
        </div>
    )
}

export default function Payment() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { token } = useAuth()

    const roomId = searchParams.get("room_id")
    const checkIn = searchParams.get("check_in")
    const checkOut = searchParams.get("check_out")

    const [room, setRoom] = useState(null)
    const [roomType, setRoomType] = useState(null)
    const [totalPrice, setTotalPrice] = useState(null)
    const [clientSecret, setClientSecret] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS)
    const elementsOptions = useMemo(() => ({ clientSecret }), [clientSecret])

    useEffect(() => {
        async function loadSummary() {
            if (!roomId || !checkIn || !checkOut) {
                setError("Missing booking details.")
                setLoading(false)
                return
            }

            try {
                const roomRes = await fetch(`http://localhost:8000/rooms/${roomId}`)
                if (!roomRes.ok) throw new Error("Room not found")
                const roomData = await roomRes.json()
                setRoom(roomData)

                const roomTypeRes = await fetch(`http://localhost:8000/room-types/${roomData.room_type_id}`)
                if (!roomTypeRes.ok) throw new Error("Room type not found")
                const roomTypeData = await roomTypeRes.json()
                setRoomType(roomTypeData)

                const intentRes = await fetch("http://localhost:8000/stripe/create-payment-intent", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ room_id: Number(roomId), check_in: checkIn, check_out: checkOut }),
                })
                if (!intentRes.ok) {
                    const err = await intentRes.json().catch(() => ({}))
                    throw new Error(err.detail || "Could not initialize payment")
                }
                const intentData = await intentRes.json()
                setClientSecret(intentData.client_secret)
                setTotalPrice(intentData.total_price)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadSummary()
    }, [roomId, checkIn, checkOut])

    useEffect(() => {
        if (loading || error) return

        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    navigate("/book-room", { replace: true })
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [loading, error])

    function handleCancel() {
        navigate("/book-room", { replace: true })
    }

    function handleSuccess() {
        navigate("/bookings", { replace: true })
    }

    if (loading) {
        return <p className="text-white p-6">Loading summary...</p>
    }

    if (error && !room) {
        return <p className="text-red-400 p-6">{error}</p>
    }

    const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    const minutes = Math.floor(secondsLeft / 60)
    const seconds = String(secondsLeft % 60).padStart(2, "0")

    return (
        <div className="max-w-lg mx-auto p-6 mt-6">
            <h1 className="text-4xl font-bold text-white mb-3 text-center">Confirm Your Booking</h1>
            <p className="text-center text-slate-400 text-sm mb-6">
                Time remaining: <span className="text-white font-medium">{minutes}:{seconds}</span>
            </p>

            <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
                <div>
                    <p className="text-slate-400 text-sm">Room Type</p>
                    <p className="text-white font-medium">{roomType?.name}</p>
                </div>
                <div>
                    <p className="text-slate-400 text-sm">Room Number</p>
                    <p className="text-white font-medium">Room {room?.room_number}</p>
                </div>
                <div className="flex gap-8">
                    <div>
                        <p className="text-slate-400 text-sm">Check-in</p>
                        <p className="text-white font-medium">{checkIn}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Check-out</p>
                        <p className="text-white font-medium">{checkOut}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Nights</p>
                        <p className="text-white font-medium">{nights}</p>
                    </div>
                </div>
                <div className="border-t border-slate-700 pt-4">
                    <p className="text-slate-400 text-sm">Total Price</p>
                    <p className="text-white text-2xl font-bold">RM{totalPrice}</p>
                </div>

                {clientSecret && (
                    <Elements stripe={stripePromise} options={elementsOptions}>
                        <PaymentSection
                            roomId={roomId}
                            checkIn={checkIn}
                            checkOut={checkOut}
                            clientSecret={clientSecret}
                            onSuccess={handleSuccess}
                        />
                    </Elements>
                )}

                <button
                    onClick={handleCancel}
                    className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-medium transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}