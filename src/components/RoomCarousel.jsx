import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const FALLBACK_IMAGE = "http://localhost:8000/static/placeholder.jpg"

export default function RoomCarousel({ images }) {
    const [index, setIndex] = useState(0)
    const list = images.length > 0 ? images : [{ image_url: FALLBACK_IMAGE }]

    const [bottomImage, setBottomImage] = useState(list[0].image_url)
    const [topImage, setTopImage] = useState(null)
    const [topOpacity, setTopOpacity] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)

    useEffect(() => {
        const targetUrl = list[index].image_url
        if (targetUrl === bottomImage) return

        setIsTransitioning(true)
        setTopImage(targetUrl)
        setTopOpacity(0)

        let raf2
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                setTopOpacity(1)
            })
        })

        const timeout = setTimeout(() => {
            setBottomImage(targetUrl)
            setTopImage(null)
            setTopOpacity(0)
            setIsTransitioning(false)
        }, 300)

        return () => {
            cancelAnimationFrame(raf1)
            if (raf2) cancelAnimationFrame(raf2)
            clearTimeout(timeout)
        }
    }, [index])

    function goPrev() {
        if (isTransitioning) return
        setIndex((prev) => Math.max(0, prev - 1))
    }

    function goNext() {
        if (isTransitioning) return
        setIndex((prev) => Math.min(list.length - 1, prev + 1))
    }

    function goTo(target) {
        if (isTransitioning) return
        setIndex(target)
    }

    return (
        <div className="relative w-full h-full overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${bottomImage})` }}
            />

            {topImage && (
                <div
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-200"
                    style={{ backgroundImage: `url(${topImage})`, opacity: topOpacity }}
                />
            )}

            {index > 0 && (
                <button
                    onClick={goPrev}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white"
                >
                    <ChevronLeft size={36} strokeWidth={3}/>
                </button>
            )}

            {index < list.length - 1 && (
                <button
                    onClick={goNext}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white"
                >
                    <ChevronRight size={36} strokeWidth={3}/>
                </button>
            )}

            {list.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {list.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            aria-label={`Go to image ${i + 1}`}
                            className={`w-2 h-2 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}