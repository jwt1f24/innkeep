export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const namePattern = /^[a-zA-Z\u00C0-\u024F\s'-]+$/

export function isValidEmail(email) {
    return emailPattern.test(email)
}

export function isValidName(name) {
    return namePattern.test(name.trim())
}