import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../AuthContext"

export default function Navbar() {
    const { isLoggedIn, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // logout handling
    function handleLogout() {
        logout()
        navigate("/")
    }

    // content
    return (
        <header className="text-gray-600 body-font bg-slate-900 border-b border-slate-700">
            <div className="container mx-auto grid grid-cols-3 items-center p-5">
                {/* left section */}
                <Link to="/" className="flex title-font font-medium items-center text-white">
                    <span className="ml-3 text-xl text-indigo-400">InnKeep</span>
                </Link>

                {/* center section */}
                <nav className="flex flex-wrap items-center justify-center gap-5 text-base">
                    <Link to="/rooms" className="text-white hover:text-indigo-400">Rooms</Link>
                    <Link to="/bookings" className="text-white hover:text-indigo-400">My Bookings</Link>
                    <Link to="/contact" className="text-white hover:text-indigo-400">Contact Us</Link>
                </nav>

                {/* right section */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={() => navigate("/book-room")}
                        className="inline-flex items-center bg-indigo-600 text-white border-0 py-1 px-3 hover:bg-indigo-500 rounded text-base"
                    >
                        Book Now
                    </button>

                    {isLoggedIn ? (
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center bg-slate-700 text-white border-0 py-1 px-3 hover:bg-slate-600 rounded text-base"
                        >
                            Logout
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            state={{ from: location }}
                            className="inline-flex items-center bg-indigo-600 text-white border-0 py-1 px-3 hover:bg-indigo-500 rounded text-base"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}