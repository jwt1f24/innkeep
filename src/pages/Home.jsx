import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Carousel from '../components/Carousel'

export default function Home() {
    const today = new Date().toISOString().split("T")[0]
    const tomorrowDate = new Date()
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrow = tomorrowDate.toISOString().split("T")[0]
    const [checkIn, setCheckIn] = useState(today)
    const [checkOut, setCheckOut] = useState(tomorrow)
    const navigate = useNavigate()
    
    // header section booking function
    function handleBookNow() {
        const params = new URLSearchParams()
        if (checkIn) params.append("check_in", checkIn)
        if (checkOut) params.append("check_out", checkOut)
        navigate(`/rooms?${params.toString()}`)
    }
    
    return (
        <div className="p-6">
            {/* header section */}
            <div className="text-center py-20">
                <h1 className="text-5xl font-bold text-indigo-400 mb-4">Welcome to Innkeep</h1>
                <p className="text-slate-300 text-lg mb-8">
                    Recharge at Innkeep, where hospitality meets luxury. Our cozy modern ambience is the perfect place for a getaway after a long day of adventuring. Surrounded with friendly eateries and shops, alongside verdant landscapes and bustling nightlife, there's always something entertaining and refreshing for you to experience here.  
                </p>

                {/* booking field subsection */}
                <div className="max-w-2xl mx-auto bg-slate-800 rounded-xl p-6 flex flex-col md:flex-row gap-4 items-end mb-16">
                    <div className="flex-1 w-full">
                        <label className="block text-slate-400 text-sm mb-1">Check-in</label>
                        <input
                            type="date"
                            value={checkIn}
                            min={today}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="w-full p-2 rounded bg-slate-700 text-white"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-slate-400 text-sm mb-1">Check-out</label>
                        <input
                            type="date"
                            value={checkOut}
                            min={today}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="w-full p-2 rounded bg-slate-700 text-white"
                        />
                    </div>
                    <button onClick={handleBookNow} className="bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-500 w-full md:w-auto">
                        BOOK NOW
                    </button>
                </div>
            </div>

            {/* rooms section  */}
            <div>
                <div>
                    <div>
                        <h1 className="text-5xl font-bold text-indigo-400 mb-4">Our Rooms</h1>
                        <p className="text-slate-300 text-lg mb-8">
                            Whether you are traveling solo or with a group, we have the perfect space for everyone.
                        </p>
                    </div>

                    <button onClick={handleBookNow} className="bg-indigo-600 text-white py-4 px-12 rounded hover:bg-indigo-500 w-full md:w-auto">
                        VIEW ALL ROOMS
                    </button>
                </div>
                
                {/* image carousel */}
                <Carousel/>
            </div>

            {/* amenities section */}
            <div>
                <h1 className="text-5xl font-bold text-indigo-400 mb-4">Why Choose Us</h1>
                <p className="text-slate-300 text-lg mb-8">
                    Our services are tailored to ensure our guests have a memorable experience. By blending luxury and comfort, surprise your close ones with a refreshing stay here at Innkeep.
                </p>
                <button onClick={handleBookNow} className="bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-500 w-full md:w-auto">
                    MORE DETAILS
                </button>
            </div>

            {/* services section */}
            <div>
                <h1 className="text-5xl font-bold text-indigo-400 mb-4">Explore Our Services</h1>
                <p className="text-slate-300 text-lg mb-8">
                    At Innkeep, we also offer additional services and merchandises to enrich your hotel experience.
                </p>
                <button onClick={handleBookNow} className="bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-500 w-full md:w-auto">
                    VIEW SERVICES
                </button>
            </div>

            {/* footer */}
            <div></div>
        </div>
    )
}