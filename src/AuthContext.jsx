import { createContext, useContext, useState, useEffect } from "react"
import { login as apiLogin } from "./api/auth"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"))
    const [isLoggedIn, setIsLoggedIn] = useState(!!token)

    useEffect(() => {
    if (token) {
        localStorage.setItem("token", token)
        setIsLoggedIn(true)
    } else {
        localStorage.removeItem("token")
        setIsLoggedIn(false)
    }
    }, [token])

    async function login(email, password) {
        const data = await apiLogin(email, password)
        setToken(data.access_token)
        return data
    }

    function logout() {
        setToken(null)
    }

    return (
        <AuthContext.Provider value={{ token, isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used within AuthProvider")
    return context
}