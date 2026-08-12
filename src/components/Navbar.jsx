import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '../AuthContext'
import Button from './Button'

export default function Navbar() {
    const { isLoggedIn, user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [open, setOpen] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        if (!open) return

        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        function handleKeyDown(e) {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [open])

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
            <div className="container mx-auto grid grid-cols-3 items-center px-6 py-4">
                {/* left section */}
                <Link to="/" className="flex title-font font-medium items-center">
                    <span className="text-2xl text-amber-800">InnKeep</span>
                </Link>

                {/* center section */}
                <nav className="flex flex-wrap items-center justify-center gap-4 lg:gap-8 text-base lg:text-lg text-black font-medium">
                    <Link to="/rooms" className="hover:text-neutral-700">Rooms</Link>
                    <Link to="/amenities" className="hover:text-neutral-700">Amenities</Link>
                    <Link to="/events" className="hover:text-neutral-700">Events</Link>
                    <Link to="/bookings" className="hover:text-neutral-700">My Bookings</Link>
                </nav>

                {/* right section */}
                <div className="flex items-center justify-end gap-6">
                    <Button onClick={() => navigate("/book-room")} className="inline-flex items-center py-1 px-6">
                        Book Now
                    </Button>

                    {/* user profile button */}
                    {isLoggedIn ? (
                        <div ref={containerRef} className="relative">
                            <button
                                onClick={() => setOpen((v) => !v)}
                                aria-expanded={open}
                                aria-haspopup="true"
                                className="flex items-center justify-center w-9 h-9 border border-neutral-400 rounded-full bg-neutral-200 hover:bg-neutral-300 text-black cursor-pointer transition-colors"
                            >
                                <User className="w-6 h-6" strokeWidth={2.5}/>
                            </button>

                            {open && (
                                <div className="absolute z-10 right-0 mt-2 w-56 bg-white border border-neutral-300 rounded-xl shadow-xl p-4">
                                    <p className="text-black text-lg font-semibold">{user?.name}</p>
                                    <p className="text-neutral-600 text-base mb-6">{user?.email}</p>
                                    <Button
                                        variant="danger"
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 rounded px-3 py-2"
                                    >
                                        <LogOut className="w-6 h-6"/>
                                        Logout
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            state={{ from: location }}
                            className="inline-flex items-center py-[2px] px-4 bg-transparent border-2 border-slate-600 text-slate-600 text-lg font-semibold hover:bg-slate-600 hover:text-white transition-colors cursor-pointer"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}