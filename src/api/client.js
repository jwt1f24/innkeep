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
        throw new Error(err.detail || `API error: ${res.status}`)
    }

    // return JSON parsed token and its type if validated
    return res.json()
}