import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

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
        setLoading(true)

        try {
            await login(email, password)
            const redirectTo = location.state?.from?.pathname || "/"
            navigate(redirectTo, { replace: true })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto p-6 mt-12">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Login</h1>

            <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 flex flex-col gap-4">
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
                        className="w-full p-2 rounded bg-slate-700 text-white"
                    />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-medium disabled:opacity-50"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                <p className="text-slate-400 text-sm text-center">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-indigo-400 hover:underline">
                        Register
                    </Link>
                </p>
            </form>
        </div>
    )
}