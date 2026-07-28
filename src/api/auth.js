import { BASE_URL } from "./client"

export async function login(email, password) {
    const form = new URLSearchParams()
    form.append("username", email)
    form.append("password", password)

    // fetch client login
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
    })

    // throw error if request failed
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Login failed")
    }

    // return JSON parsed token and its type if validated
    return res.json()
}