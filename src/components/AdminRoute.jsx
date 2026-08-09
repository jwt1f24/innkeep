import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../AuthContext"

export default function AdminRoute({ children }) {
    const { isLoggedIn, user } = useAuth()
    const location = useLocation()

    {/* if user not logged in, redirect to login page */}
    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace/>
    }

    {/* if user not admin, redirect to user side pages */}
    if (user?.role !== "admin") {
        return <Navigate to="/" replace />
    }

    return children
}