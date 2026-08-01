import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BedDouble, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function describeBeds(room) {
    const parts = []
    if (room.king_beds > 0) parts.push(`${room.king_beds} King`)
    if (room.queen_beds > 0) parts.push(`${room.queen_beds} Queen`)
    if (room.single_beds > 0) parts.push(`${room.single_beds} Single`)
    return parts.length > 0 ? parts.join(", ") : "No beds listed"
}

function chunkArray(array, size) {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

export default function HomeCarousel() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // smooth slide loop transition
    const [position, setPosition] = useState(1);
    const [withTransition, setWithTransition] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const slides = chunkArray(rooms, 2);
    const extendedSlides = [slides[slides.length - 1], ...slides, slides[0]];

    useEffect(() => {
        async function fetchData() {
            try {
                const [typesRes, imagesRes] = await Promise.all([
                    fetch('http://localhost:8000/room-types/'),
                    fetch('http://localhost:8000/room-images/'),
                ]);
                if (!typesRes.ok || !imagesRes.ok) throw new Error('Failed to fetch room data');

                const types = await typesRes.json();
                const images = await imagesRes.json();

                const withImages = types.map((room) => {
                    const match = images.find((img) => img.room_type_id === room.id);
                    return { ...room, image_url: match ? match.image_url : null };
                });

                setRooms(withImages);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex gap-6 py-4 w-full px-4">
                {[1, 2].map((n) => (
                    <div key={n} className="flex-1 h-96 bg-slate-800 animate-pulse rounded-2xl" />
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-400 py-8">Unable to load rooms: {error}</div>;
    }

    if (rooms.length === 0) {
        return <div className="text-center text-slate-400 py-8">No room types available.</div>;
    }

    function goPrev() {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setWithTransition(true);
        setPosition((prev) => prev - 1);
    }

    function goNext() {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setWithTransition(true);
        setPosition((prev) => prev + 1);
    }

    function handleTransitionEnd() {
        if (position === extendedSlides.length - 1) {
            // landed on the cloned first slide -> silently snap to the real first slide
            setWithTransition(false);
            setPosition(1);
        } else if (position === 0) {
            // landed on the cloned last slide -> silently snap to the real last slide
            setWithTransition(false);
            setPosition(slides.length);
        }
        setIsTransitioning(false);
    }

    // real dot index clone offset
    const realIndex = (position - 1 + slides.length) % slides.length;

    return (
        <div className="w-full my-6 px-4">
            <div className="flex items-center gap-4">
                {/* left arrow, separate from track */}
                <button
                    onClick={goPrev}
                    aria-label="Previous slide"
                    className="text-white hover:text-indigo-400 transition-colors flex-none cursor-pointer"
                >
                    <ChevronLeft size={40} strokeWidth={3} />
                </button>

                {/* sliding track */}
                <div className="overflow-hidden flex-1">
                    <div
                        className={`flex ${withTransition ? 'transition-transform duration-400 ease-in-out' : ''}`}
                        style={{ transform: `translateX(-${position * 100}%)` }}
                        onTransitionEnd={handleTransitionEnd}
                    >
                        {extendedSlides.map((slide, slideIndex) => (
                            <div key={slideIndex} className="flex-none w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                                {slide.map((room) => (
                                    <div
                                        key={room.id}
                                        className="relative h-120 overflow-hidden shadow-xl"
                                    >
                                        <div
                                            className="absolute inset-0 bg-cover bg-center"
                                            style={{
                                                backgroundImage: `url(${room.image_url || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"})`,
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                        <div className="relative z-10 h-full flex flex-col justify-end p-5">
                                            <div className="flex items-end justify-between gap-4">
                                                {/* room type name & tags */}
                                                <div>
                                                    <h3 className="text-4xl font-bold text-white mb-2">{room.name}</h3>
                                                    <div className="flex gap-6 flex-wrap">
                                                        <span className="flex items-center gap-1.5 text-slate-200 text-m font-medium">
                                                            <BedDouble className="w-5 h-5" />
                                                            {describeBeds(room)}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-slate-200 text-m font-medium">
                                                            <Users className="w-5 h-5" />
                                                            {room.accommodates}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* booking button */}
                                                <button
                                                    onClick={() => navigate(`/rooms?room_type_id=${room.id}`)}
                                                    className="flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-12 py-4 rounded text-lg transition-colors"
                                                >
                                                    BOOK NOW
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* right arrow, separate from track */}
                <button
                    onClick={goNext}
                    aria-label="Next slide"
                    className="text-white hover:text-indigo-400 transition-colors flex-none cursor-pointer"
                >
                    <ChevronRight size={40} strokeWidth={3} />
                </button>
            </div>

            {/* dot indicators */}
            <div className="flex justify-center items-center gap-2 mt-6">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (isTransitioning) return;
                            setWithTransition(true);
                            setPosition(index + 1);
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                        className={`w-2.5 h-2.5 rounded-full ${
                            realIndex === index ? 'bg-indigo-500' : 'bg-slate-700'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}