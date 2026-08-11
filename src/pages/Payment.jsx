import { BASE_URL } from '../api/client'
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard } from 'lucide-react'
import { useAuth } from '../AuthContext'
import { stripePromise } from '../stripe'
import Button from '../components/Button'
import Dropdown from '../components/Dropdown'

const TIMEOUT_SECONDS = 5 * 60

const cardFieldStyle = {
    style: {
        base: {
            color: "#0a0a0a",
            fontSize: "16px",
            "::placeholder": { color: "#94a3b8" },
        },
    },
}

function PaymentSection({ items, checkIn, checkOut, clientSecret, onSuccess }) {
    const stripe = useStripe()
    const elements = useElements()
    const { token } = useAuth()

    const [cards, setCards] = useState([])
    const [selectedMethod, setSelectedMethod] = useState(null)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [addingNew, setAddingNew] = useState(false)

    const [name, setName] = useState("")
    const [postcode, setPostcode] = useState("")
    const [addingCard, setAddingCard] = useState(false)
    const [addError, setAddError] = useState("")

    const [paying, setPaying] = useState(false)
    const [payError, setPayError] = useState("")

    useEffect(() => {
        loadCards()
    }, [])

    async function loadCards() {
        try {
            const res = await fetch(`${BASE_URL}/stripe/payment-methods`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) setCards(await res.json())
        } catch (err) {
            setPayError(err.message)
        }
    }

    function selectedCard() {
        return cards.find((c) => c.id === selectedMethod)
    }

    async function handleAddCard(e) {
        e.preventDefault()
        if (!stripe || !elements) return
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
            const attachRes = await fetch(`${BASE_URL}/stripe/attach-payment-method?payment_method_id=${paymentMethod.id}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!attachRes.ok) throw new Error("Failed to save card")
        } catch (err) {
            setAddError(err.message)
            setAddingCard(false)
            return
        }

        await loadCards()
        setSelectedMethod(paymentMethod.id)
        setAddingNew(false)
        setName("")
        setPostcode("")
        setAddingCard(false)
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
                const bookingRes = await fetch(`${BASE_URL}/bookings/multi`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        items,
                        check_in: checkIn,
                        check_out: checkOut,
                        payment_intent_id: paymentIntent.id,
                    }),
                })
                if (!bookingRes.ok) {
                    const err = await bookingRes.json().catch(() => ({}))
                    throw new Error(err.detail || "Booking failed. Your payment has been refunded.")
                }
                onSuccess()
            } catch (err) {
                setPayError(err.message)
                setPaying(false)
            }
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div>
                <label className="block text-black text-base mb-2">Payment Method</label>
                <Dropdown
                    icon={CreditCard}
                    value={selectedCard() ? `${selectedCard().brand} •••• ${selectedCard().last4}` : null}
                    placeholder="Select a payment method"
                    options={cards.map((c) => ({ id: c.id, label: `${c.brand} •••• ${c.last4}` }))}
                    onSelect={setSelectedMethod}
                />
                <button type="button" onClick={() => setAddingNew((v) => !v)} className="text-blue-600 hover:underline text-base mt-2 cursor-pointer">
                    {addingNew ? "Cancel" : "+ Add new card"}
                </button>
            </div>

            {addingNew && (
                <form onSubmit={handleAddCard} className="flex flex-col gap-3 bg-neutral-100 border border-neutral-300 text-black text-base p-4 rounded-xl">
                    <div>
                        <label className="block mb-2">Name on card</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 rounded bg-white border border-neutral-400"/>
                    </div>
                    <div>
                        <label className="block mb-2">Card details</label>
                        <div className="bg-white border border-neutral-400 rounded">
                            <div className="p-3 border-b border-neutral-400">
                                <CardNumberElement options={{ ...cardFieldStyle, disableLink: true }} />
                            </div>
                            <div className="flex">
                                <div className="flex-1 p-3 border-r border-neutral-400">
                                    <CardExpiryElement options={cardFieldStyle} />
                                </div>
                                <div className="flex-1 p-3">
                                    <CardCvcElement options={cardFieldStyle} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2">Billing postcode</label>
                        <input type="text" inputMode="numeric" pattern="\d{3,10}" value={postcode} onChange={(e) => setPostcode(e.target.value)} required className="w-full p-2 rounded bg-white border border-neutral-400"/>
                    </div>
                    <p className="text-red-500 min-h-[20px]">{addError}</p>
                    <Button type="submit" disabled={!stripe || addingCard} className="py-2 rounded disabled:opacity-50">
                        {addingCard ? "Adding..." : "Add & Use Card"}
                    </Button>
                </form>
            )}

            <p className="text-red-500 text-base text-center min-h-[20px]">{payError}</p>

            <Button onClick={handlePay} disabled={!stripe || !selectedMethod || paying} className="py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                {paying ? "Processing..." : "Pay Now"}
            </Button>
        </div>
    )
}

export default function Payment() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { token } = useAuth()

    const checkIn = searchParams.get("check_in")
    const checkOut = searchParams.get("check_out")
    const items = JSON.parse(searchParams.get("items") || "[]")

    const [roomTypes, setRoomTypes] = useState([])
    const [clientSecret, setClientSecret] = useState(null)
    const [grandTotal, setGrandTotal] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS)

    useEffect(() => {
        async function loadSummary() {
            if (!checkIn || !checkOut || items.length === 0) {
                setError("Missing booking details.")
                setLoading(false)
                return
            }
            try {
                const typesRes = await fetch(`${BASE_URL}/room-types/`)
                if (!typesRes.ok) throw new Error("Failed to load room types")
                const allTypes = await typesRes.json()
                setRoomTypes(allTypes)

                const intentRes = await fetch(`${BASE_URL}/stripe/create-payment-intent-multi`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ items, check_in: checkIn, check_out: checkOut }),
                })
                if (!intentRes.ok) {
                    const err = await intentRes.json().catch(() => ({}))
                    throw new Error(err.detail || "Could not initialize payment")
                }
                const intentData = await intentRes.json()
                setClientSecret(intentData.client_secret)
                setGrandTotal(intentData.total_price)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadSummary()
    }, [token])

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

    if (loading) return <p className="text-white text-center p-6">Loading summary...</p>
    if (error && !clientSecret) return <p className="text-red-500 text-center p-6">{error}</p>

    function roomTypeName(id) {
        return roomTypes.find((rt) => rt.id === id)?.name || "Room"
    }

    const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    const minutes = Math.floor(secondsLeft / 60)
    const seconds = String(secondsLeft % 60).padStart(2, "0")

    return (
        <div className="py-12">
            <div className="max-w-lg mx-auto">
                <h1 className="text-4xl font-semibold text-white mb-4 text-center">Confirm Payment</h1>
                <p className="text-center text-neutral-100 text-base mb-6">
                    Time remaining: <span className="text-white font-semibold">{minutes}:{seconds}</span>
                </p>

                <div className="bg-white rounded-xl p-6 flex flex-col gap-3 shadow-xl">
                    <div className="flex justify-between text-black text-base">
                        <span>Dates</span>
                        <span className="font-medium">{checkIn} - {checkOut}</span>
                    </div>
                    <div className="flex justify-between text-black text-base">
                        <span>Nights</span>
                        <span className="font-medium">{nights}</span>
                    </div>

                    <div className="border-t border-neutral-300 pt-3 flex flex-col gap-3">
                        {items.map((item) => (
                            <div key={item.room_type_id} className="flex justify-between text-black text-base">
                                <span>{roomTypeName(item.room_type_id)} × {item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-neutral-300 text-black pt-3 flex justify-between">
                        <p className="text-xl">Total Price</p>
                        <p className="text-xl font-bold">RM{Number(grandTotal).toFixed(2)}</p>
                    </div>

                    {clientSecret && (
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <PaymentSection items={items} checkIn={checkIn} checkOut={checkOut} clientSecret={clientSecret} onSuccess={handleSuccess} />
                        </Elements>
                    )}

                    <Button variant="neutral" onClick={handleCancel} className="py-2 rounded">
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    )
}