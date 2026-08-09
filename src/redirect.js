export function getRedirectPath(locationState, fallback = "/") {
    const from = locationState?.from
    return from ? `${from.pathname}${from.search || ""}` : fallback
}