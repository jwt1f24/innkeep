import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { isValidEmail } from '../validators'
import { getRedirectPath } from '../redirect'
import Button from '../components/Button'
import Input from '../components/Input'

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")

        // input edge case
        if (!isValidEmail(email)) {
            setError("Please enter a valid email address.")
            return
        }

        if (password.trim().length < 8) {
            setError("Password must be at least 8 characters.")
            return
        }

        setLoading(true)
        try {
            const profile = await login(email, password)

            if (profile.role === "admin") {
                navigate("/admin-dashboard", { replace: true })
            } else {
                navigate(getRedirectPath(location.state), { replace: true }) 
            }
        } catch (err) {
            setError("Login failed, invalid input or account doesn't exist.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto py-12">
            <h1 className="text-4xl font-semibold text-white mb-8 text-center">Login</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 flex flex-col gap-4">
                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded"
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded"
                    required
                />

                <p className="text-red-500 text-base text-center min-h-[20px]">{error}</p>

                <Button
                    type="submit"
                    disabled={loading}
                    className="py-2 rounded disabled:opacity-50"
                >
                    {loading ? "Logging in..." : "Login"}
                </Button>

                <p className="text-black text-base text-center">
                    Don't have an account?{" "}
                    <Link to="/register" state={location.state} className="text-blue-600 hover:underline">
                        Register
                    </Link>
                </p>
            </form>
        </div>
    )
}