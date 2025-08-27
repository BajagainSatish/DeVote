// client/src/utils/zkSimple.js
// Simple zero-knowledge helpers (hash-based commitments + small proof simulation)

async function sha256Hex(str) {
    const enc = new TextEncoder()
    const data = enc.encode(str)
    const hashBuf = await crypto.subtle.digest("SHA-256", data)
    const hashArr = Array.from(new Uint8Array(hashBuf))
    return hashArr.map(b => b.toString(16).padStart(2, "0")).join("")
}

function randomHex(bytes = 16) {
    const arr = new Uint8Array(bytes)
    crypto.getRandomValues(arr)
    return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Create a commitment for a ballot string.
 * @param {string} ballot - canonical ballot string (e.g. "VOTE:123")
 * @returns {Promise<{commitment: string, secret: string}>}
 */
export async function createCommitment(ballot) {
    const secret = randomHex(16) // 128-bit random secret
    const commitment = await sha256Hex(`${ballot}:${secret}`)
    return { commitment, secret }
}

/**
 * Small "proof" derived from commitment + secret.
 * (Not necessary for the simple verify step but included if you want to show
 * a secondary proof.)
 */
export async function makeProof(commitment, secret) {
    return await sha256Hex(`${commitment}:${secret}`)
}
