export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export async function apiFetch(path, options = {}) {
    // fetch vite api
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
    })

    // throw error if request failed
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        let message = `API error: ${res.status}`

        if (typeof err.detail === "string") {
            message = err.detail
        } else if (Array.isArray(err.detail)) {
            message = err.detail.map((e) => e.msg).join(", ")
        }

        throw new Error(message)
    }

    // return JSON parsed token and its type if validated
    return res.json()
}