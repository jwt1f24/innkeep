import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../AuthContext"

export default function ProtectedRoute({ children }) {
    const { isLoggedIn } = useAuth()
    const location = useLocation()

    // login handling
    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // content
    return children
}