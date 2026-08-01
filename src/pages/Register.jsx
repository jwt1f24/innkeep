import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuth } from '../AuthContext'

export default function Register() {
    const [name, setName] = useState("")
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
        if (name.trim().length < 1) {
            setError("Please enter your name.")
            return
        }

        const name_pattern = /^[a-zA-Z\u00C0-\u024F\s'-]+$/
        if (!name_pattern.test(name.trim())) {
            setError("Name can only contain letters.")
            return
        }

        const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email_pattern.test(email)) {
            setError("Please enter a valid email address.")
            return
        }

        if (password.trim().length < 8) {
            setError("Password must be at least 8 characters.")
            return
        }

        setLoading(true)
        try {
            await register(name, email, password)
            await login(email, password)
            const redirectTo = location.state?.from?.pathname || "/"
            navigate(redirectTo, { replace: true })
        } catch (err) {
            setError("Registration failed, invalid input or account already exists.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto p-6 mt-12">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Register</h1>

            <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
                <div>
                    <label className="block text-slate-400 text-sm mb-1">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full p-2 rounded bg-slate-700 text-white"
                    />
                </div>

                <div>
                    <label className="block text-slate-400 text-sm mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-2 rounded bg-slate-700 text-white"
                    />
                </div>

                <div>
                    <label className="block text-slate-400 text-sm mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full p-2 rounded bg-slate-700 text-white"
                    />
                </div>

                <p className="text-red-400 text-sm min-h-[20px]">{error}</p>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-medium disabled:opacity-50"
                >
                    {loading ? "Creating account..." : "Register"}
                </button>

                <p className="text-slate-400 text-m text-center">
                    Already have an account?{" "}
                    <Link to="/login" state={location.state} className="text-indigo-400 hover:underline">
                        Login
                    </Link>
                </p>
            </form>
        </div>
    )
}