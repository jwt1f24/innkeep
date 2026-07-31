import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'

export default function Register() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            await register(name, email, password)
            navigate("/login")
        } catch (err) {
            setError(err.message)
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

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-medium disabled:opacity-50"
                >
                    {loading ? "Creating account..." : "Register"}
                </button>

                <p className="text-slate-400 text-sm text-center">
                    Already have an account?{" "}
                    <Link to="/login" className="text-indigo-400 hover:underline">
                        Login
                    </Link>
                </p>
            </form>
        </div>
    )
}