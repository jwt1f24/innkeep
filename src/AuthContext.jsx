import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { login as apiLogin } from "./api/auth"

const AuthContext = createContext(null)
const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000"

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"))
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    // fetch current user
    const fetchUser = useCallback(async (currentToken) => {
        const res = await fetch(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${currentToken}` },
        })
        if (!res.ok) throw new Error("Failed to load profile")
        return res.json()
    }, [])

    // sync token state with local storage
    useEffect(() => {
        let isMounted = true

        async function initAuth() {
            if (token) {
                localStorage.setItem("token", token)
                try {
                    const profile = await fetchUser(token)
                    if (isMounted) setUser(profile)
                } catch (err) {
                    // Token expired or invalid -> log out clean
                    console.error("Auth initialization failed:", err)
                    if (isMounted) {
                        localStorage.removeItem("token")
                        setToken(null)
                        setUser(null)
                    }
                }
            } else {
                localStorage.removeItem("token")
                setUser(null)
            }

            if (isMounted) setLoading(false)
        }
        initAuth()
        return () => { isMounted = false }
    }, [token, fetchUser])

    async function login(email, password) {
        setLoading(true)
        try {
            const data = await apiLogin(email, password)
            setToken(data.access_token)
            const profile = await fetchUser(data.access_token)
            setUser(profile)
            setLoading(false)
            return profile
        } catch (err) {
            setLoading(false)
            throw err
        }
    }

    function logout() {
        localStorage.removeItem("token")
        setToken(null)
        setUser(null)
        navigate("/", { replace: true })
    }

    const isLoggedIn = !!token && !!user
    const value = useMemo(
        () => ({ token, isLoggedIn, user, loading, login, logout }),
        [token, isLoggedIn, user, loading]
    )

    // finish initial auth check first
    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex h-screen items-center justify-center bg-white text-black">
                    Loading application...
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used within AuthProvider")
    return context
}