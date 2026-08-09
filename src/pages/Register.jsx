import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuth } from '../AuthContext'
import { isValidEmail, isValidName } from '../validators'
import { getRedirectPath } from '../redirect'
import Button from '../components/Button'
import Input from '../components/Input'

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

        if (!isValidName(name)) {
            setError("Name can only contain letters.")
            return
        }

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
            await register(name, email, password)
            await login(email, password)
            navigate(getRedirectPath(location.state), { replace: true })
        } catch (err) {
            setError("Registration failed, invalid input or account already exists.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto py-12">
            <h1 className="text-4xl font-semibold text-white mb-8 text-center">Register</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 flex flex-col gap-4">
                <Input
                    label="Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded"
                    required
                />
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
                    minLength={8}
                    className="rounded"
                    required
                />

                <p className="text-red-500 text-base text-center min-h-[20px]">{error}</p>

                <Button type="submit" disabled={loading} className="py-2 rounded disabled:opacity-50">
                    {loading ? "Creating account..." : "Register"}
                </Button>

                <p className="text-black text-base text-center">
                    Already have an account?{" "}
                    <Link to="/login" state={location.state} className="text-blue-600 hover:underline">
                        Login
                    </Link>
                </p>
            </form>
        </div>
    )
}