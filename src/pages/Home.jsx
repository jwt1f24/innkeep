import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wifi, Tv, Dumbbell, Utensils, Sparkles, CalendarDays, Mail, MapPin, Phone } from 'lucide-react'
import HomeCarousel from '../components/HomeCarousel'
import RoomCarousel from '../components/RoomCarousel'
import Button from '../components/Button'

export default function Home() {
    const today = new Date().toISOString().split("T")[0]
    const tomorrowDate = new Date()
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrow = tomorrowDate.toISOString().split("T")[0]
    const [checkIn, setCheckIn] = useState(today)
    const [checkOut, setCheckOut] = useState(tomorrow)
    const navigate = useNavigate()
    const amenityImages = [
        { image_url: "http://localhost:8000/static/home2.jpg" },
        { image_url: "http://localhost:8000/static/home3.jpg" }
    ]
    
    // header section booking function
    function handleBookNow() {
        const params = new URLSearchParams()
        if (checkIn) params.append("check_in", checkIn)
        if (checkOut) params.append("check_out", checkOut)
        navigate(`/book-room?${params.toString()}`)
    }
    
    return (
        <div className="px-6">
            {/* header section */}
            <div className="relative text-center -mx-6 pt-56 pb-64 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(http://localhost:8000/static/home1.jpg)` }}
                />
                <div className="absolute inset-0 bg-black/30" />

                <div className="relative z-10">
                    <h1 className="text-5xl font-semibold text-white mb-4">Welcome to Innkeep</h1>
                    <p className="text-white text-lg mb-8 max-w-2xl mx-auto">
                        Our cozy modern ambience is the perfect place for a getaway after a long day of adventuring. Surrounded with friendly eateries and shops, vibrant landscapes and bustling nightlife, there's always something entertaining for you to experience here.  
                    </p>

                    {/* booking field subsection */}
                    <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4 items-end mb-16">
                        <div className="flex-1 w-full">
                            <label className="block text-white font-semibold text-lg mb-1">Check-in</label>
                            <input
                                type="date"
                                value={checkIn}
                                min={today}
                                onChange={(e) => setCheckIn(e.target.value)}
                                className="w-full p-2 bg-white text-black text-lg"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-white font-semibold text-lg mb-1">Check-out</label>
                            <input
                                type="date"
                                value={checkOut}
                                min={tomorrow}
                                onChange={(e) => setCheckOut(e.target.value)}
                                className="w-full p-2 bg-white text-black text-lg"
                            />
                        </div>
                        <Button onClick={handleBookNow} className="py-2 px-6 w-full md:w-auto">
                            BOOK NOW
                        </Button>
                    </div>
                </div>
            </div>

            {/* rooms section  */}
            <div className="bg-amber-50 -mx-6 pb-24 px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pt-24">
                    <div className="pl-[4.5rem]">
                        <h1 className="text-neutral-800 text-5xl font-semibold mb-4">Our Rooms</h1>
                        <p className="text-neutral-800 text-lg mb-8">
                            Whether you are traveling solo or with a group, we have the perfect space for everyone.
                        </p>
                    </div>

                    <div className="pr-[4.5rem]">
                        <Button onClick={() => navigate("/rooms")} className="py-4 px-12 flex-none">
                            VIEW ALL ROOMS
                        </Button>
                    </div>
                </div>
                
                {/* image carousel */}
                <HomeCarousel/>
            </div>

            {/* amenities section */}
            <div className="bg-neutral-100 -mx-6 grid grid-cols-1 md:grid-cols-2 min-h-[36rem]">
                <div className="pl-48 py-24">
                    <h2 className="text-4xl font-semibold text-neutral-900 mb-4">Why Choose Us</h2>
                    <p className="text-neutral-800 text-lg mb-6">
                        Enjoy a range of amenities designed to make your stay comfortable and memorable.
                    </p>
                    <ul className="text-neutral-800 text-lg mb-12 space-y-3">
                        <li className="flex items-center gap-3">
                            <Wifi className="w-8 h-8 text-slate-800 flex-none" />
                            Free Internet
                        </li>
                        <li className="flex items-center gap-3">
                            <Tv className="w-8 h-8 text-slate-800 flex-none" />
                            Smart TV
                        </li>
                        <li className="flex items-center gap-3">
                            <Dumbbell className="w-8 h-8 text-slate-800 flex-none" />
                            Swimming pool and indoor gym
                        </li>
                        <li className="flex items-center gap-3">
                            <Utensils className="w-8 h-8 text-slate-800 flex-none" />
                            On-site restaurant and bar
                        </li>
                        <li className="flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-slate-800 flex-none" />
                            Daily room service and housekeeping
                        </li>
                    </ul>
                    <Button variant="outline" onClick={() => navigate("/amenities")} className="py-3 px-8">
                        VIEW AMENITIES
                    </Button>
                </div>
                <div>
                    <RoomCarousel images={amenityImages}/>
                </div>
            </div>

            {/* events section */}
            <div className="bg-white -mx-6 grid grid-cols-1 md:grid-cols-2 items-center min-h-[36rem]">
                <div className="flex items-center justify-center p-6">
                    <img
                        src="http://localhost:8000/static/home4.jpg"
                        alt="Booking Calendar"
                        className="w-full max-w-2xl h-120 object-cover"
                    />
                </div>

                <div className="pr-64">
                    <h2 className="text-4xl font-semibold text-neutral-900 mb-4">Plan The Best Booking Rates</h2>
                    <p className="text-neutral-800 text-lg mb-6">
                        Check our events section to view a list of holiday event periods to find the perfect dates for your stay.
                    </p>
                    <ul className="text-neutral-800 text-lg mb-12 space-y-3">
                        <li className="flex items-center gap-3">
                            <CalendarDays className="w-8 h-8 text-slate-800 flex-none" />
                            Holiday events
                        </li>
                    </ul>
                    <Button variant="outline" onClick={() => navigate("/events")} className="py-3 px-8">
                        VIEW EVENTS
                    </Button>
                </div>
            </div>

            {/* contact section */}
            <div className="relative -mx-6 py-24 overflow-hidden min-h-[36rem]">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(http://localhost:8000/static/home5.jpg)` }}
                />
                <div className="absolute inset-0 bg-black/40" />

                <div className="relative z-10 text-center pt-16">
                    <h2 className="text-4xl font-semibold text-white mb-4">Contact Us</h2>
                    <p className="text-white text-lg mb-10 max-w-2xl mx-auto">
                        We want to have a transparent and welcoming communication with our guests, so if you have any enquiries, do not hesitate to reach out to us!
                    </p>

                    <div className="flex flex-col md:flex-row justify-center gap-16">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 flex items-center justify-center bg-white rounded-full flex-none">
                                <Mail className="w-6 h-6 text-neutral-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-white text-lg font-semibold">Email</p>
                                <p className="text-white text-lg">mail@innkeep.com</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 flex items-center justify-center bg-white rounded-full flex-none">
                                <Phone className="w-6 h-6 text-neutral-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-white text-lg font-semibold">Phone</p>
                                <p className="text-white text-lg">+60 12-345 6789</p>  
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 flex items-center justify-center bg-white rounded-full flex-none">
                                <MapPin className="w-6 h-6 text-neutral-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-white text-lg font-semibold">Address</p>
                                <p className="text-white text-lg">67, Skibidi Street, Ohio Valley</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}