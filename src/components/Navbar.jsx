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
            <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
            {/* logo left */}
            <Link to="/" className="flex title-font font-medium items-center text-white mb-4 md:mb-0">
                <span className="ml-3 text-xl text-indigo-400">InnKeep</span>
            </Link>

            {/* nav links center */}
            <nav className="md:ml-auto md:mr-auto flex flex-wrap items-center text-base justify-center">
                <Link to="/rooms" className="mr-5 text-white hover:text-indigo-400">
                Rooms
                </Link>
                <Link to="/bookings" className="mr-5 text-white hover:text-indigo-400">
                My Bookings
                </Link>
                <Link to="/contact" className="mr-5 text-white hover:text-indigo-400">
                Contact Us
                </Link>
            </nav>

            {/* auth button right */}
            {isLoggedIn ? (
                <button
                    onClick={handleLogout}
                    className="inline-flex items-center bg-slate-700 text-white border-0 py-1 px-3 hover:bg-slate-600 rounded text-base mt-4 md:mt-0"
                >
                Logout
                </button>
            ) : (
                <Link
                    to="/login"
                    state={{ from: location }}
                    className="inline-flex items-center bg-indigo-600 text-white border-0 py-1 px-3 hover:bg-indigo-500 rounded text-base mt-4 md:mt-0"
                >
                Login
                </Link>
            )}
            </div>
        </header>
    )
}