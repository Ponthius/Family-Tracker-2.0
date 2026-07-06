/**
 * A thin wrapper around fetch() for all API calls.
 * - Always sends/receives JSON
 * - Always includes the session cookie (credentials: "include")
 * - Throws an Error with the server's message if the response is not ok
 */
async function request(method, path, body) {
    const res = await fetch(path, {
        method,
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? "An unexpected error occurred.");
    }
    return data;
}
export const api = {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    patch: (path, body) => request("PATCH", path, body),
    delete: (path) => request("DELETE", path),
};
