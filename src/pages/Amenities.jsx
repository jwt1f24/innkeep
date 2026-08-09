import { useState } from 'react'
import RoomCarousel from '../components/RoomCarousel'

const gallery1 = [
    { image_url: "http://localhost:8000/static/am1.jpg" },
    { image_url: "http://localhost:8000/static/am2.jpg" },
    { image_url: "http://localhost:8000/static/am3.jpg" },
]
const gallery2 = [
    { image_url: "http://localhost:8000/static/am4.jpg" },
    { image_url: "http://localhost:8000/static/am5.jpg" },
    { image_url: "http://localhost:8000/static/am6.jpg" },
    { image_url: "http://localhost:8000/static/am7.jpg" },
]
const gallery3 = [
    { image_url: "http://localhost:8000/static/am8.jpg" },
    { image_url: "http://localhost:8000/static/am9.jpg" },
    { image_url: "http://localhost:8000/static/am10.jpg" },
    { image_url: "http://localhost:8000/static/am11.jpg" },
]

export default function Amenities() {
    return (
        <div className="pb-24">
            <div className="bg-cyan-900 text-center mb-5 py-16">
                <h1 className="text-white text-4xl font-semibold mb-3">Our Amenities</h1>
                <p className="text-neutral-100 text-lg max-w-2xl mx-auto">
                    Discover the various attractions here that will ensure an unforgettable experience for every guest.
                </p>
            </div>

            {/* gallery content */}
            <div className="flex flex-col gap-10 px-6 py-6 max-w-5xl mx-auto">
                {/* recreation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-white shadow-xl">
                    <div className="text-black pl-12">
                        <h2 className="text-2xl font-semibold mb-3">Recreation</h2>
                        <p className="text-base">
                            Take a dip in our swimming pool, workout in our fully-equipped indoor gym, or play some 8-ball pool, they're all open 24/7 for your leisure.
                        </p>
                    </div>
                    <div className="h-72">
                        <RoomCarousel images={gallery1} />
                    </div>
                </div>

                {/* dining */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-white shadow-xl">
                    <div className="text-black md:order-2 pr-12">
                        <h2 className="text-2xl font-semibold mb-3">On-site Restaurants & Bars</h2>
                        <p className="text-base">
                            From morning buffets to evening fine dining to midnight bars, our dining facilities ensure that everyone leaves with their appetites full and tastebuds satisfied.
                        </p>
                    </div>
                    <div className="h-72 md:order-1">
                        <RoomCarousel images={gallery2} />
                    </div>
                </div>

                {/* natural scenery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-white shadow-xl">
                    <div className="text-black pl-12">
                        <h2 className="text-2xl font-semibold mb-3">Natural Sceneries</h2>
                        <p className="text-base">
                            Visit the nearby fruit farms, greenhouse, and local markets, where guests get to pick fruits and groceries for their taking.
                        </p>
                    </div>
                    <div className="h-72">
                        <RoomCarousel images={gallery3} />
                    </div>
                </div>
            </div>
        </div>
    )
}