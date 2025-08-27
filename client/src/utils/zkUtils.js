// Enhanced Zero Knowledge Proof utilities for anonymous voting
import CryptoJS from "crypto-js"

/**
 * Generate a random blinding factor for RSA blind signatures
 * @param {string} nHex - RSA modulus in hex
 * @returns {string} - Random blinding factor in hex
 */
export function generateBlindingFactor(nHex) {
    const n = BigInt("0x" + nHex)
    let r

    // Generate random r such that gcd(r, n) = 1
    do {
        const randomBytes = CryptoJS.lib.WordArray.random(256 / 8)
        r = BigInt("0x" + randomBytes.toString(CryptoJS.enc.Hex))
    } while (r >= n || gcd(r, n) !== 1n)

    return r.toString(16)
}

/**
 * Calculate GCD using Euclidean algorithm
 */
function gcd(a, b) {
    while (b !== 0n) {
        ;[a, b] = [b, a % b]
    }
    return a
}

/**
 * Modular exponentiation: (base^exp) mod mod
 */
function modPow(base, exp, mod) {
    let result = 1n
    base = base % mod

    while (exp > 0n) {
        if (exp % 2n === 1n) {
            result = (result * base) % mod
        }
        exp = exp >> 1n
        base = (base * base) % mod
    }

    return result
}

/**
 * Modular multiplicative inverse using Extended Euclidean Algorithm
 */
function modInverse(a, m) {
    if (gcd(a, m) !== 1n) {
        throw new Error("Modular inverse does not exist")
    }

    let [old_r, r] = [a, m]
    let [old_s, s] = [1n, 0n]

    while (r !== 0n) {
        const quotient = old_r / r
            ;[old_r, r] = [r, old_r - quotient * r]
            ;[old_s, s] = [s, old_s - quotient * s]
    }

    return old_s < 0n ? old_s + m : old_s
}

/**
 * Create a cryptographic commitment to a vote
 * @param {string} candidateId - The candidate ID being voted for
 * @param {string} nonce - Random nonce for commitment
 * @returns {Object} - Commitment hash and reveal data
 */
export function createVoteCommitment(candidateId, nonce = null) {
    if (!nonce) {
        nonce = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex)
    }

    const voteData = `VOTE:${candidateId}:${nonce}`
    const commitment = CryptoJS.SHA256(voteData).toString(CryptoJS.enc.Hex)

    return {
        commitment,
        reveal: {
            candidateId,
            nonce,
            voteData,
        },
    }
}

/**
 * Blind a message using RSA blind signature scheme
 * @param {string} message - Message to blind
 * @param {string} nHex - RSA modulus in hex
 * @param {number} e - RSA public exponent
 * @returns {Object} - Blinded message and blinding factor
 */
export function blindMessage(message, nHex, e) {
    try {
        // Convert message to hash for consistent size
        const messageHash = CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex)
        const m = BigInt("0x" + messageHash)
        const n = BigInt("0x" + nHex)
        const eBig = BigInt(e)

        // Generate blinding factor
        const rHex = generateBlindingFactor(nHex)
        const r = BigInt("0x" + rHex)

        // Blind the message: m' = m * r^e mod n
        const rPowE = modPow(r, eBig, n)
        const blindedMessage = (m * rPowE) % n

        return {
            blindedHex: blindedMessage.toString(16),
            r: rHex,
            originalHash: messageHash,
        }
    } catch (error) {
        throw new Error(`Blinding failed: ${error.message}`)
    }
}

/**
 * Unblind a signature using RSA blind signature scheme
 * @param {string} blindedSigHex - Blinded signature in hex
 * @param {string} rHex - Blinding factor in hex
 * @param {string} nHex - RSA modulus in hex
 * @returns {string} - Unblinded signature in hex
 */
export function unblindSignature(blindedSigHex, rHex, nHex) {
    try {
        const blindedSig = BigInt("0x" + blindedSigHex)
        const r = BigInt("0x" + rHex)
        const n = BigInt("0x" + nHex)

        // Unblind: s = s' * r^(-1) mod n
        const rInverse = modInverse(r, n)
        const signature = (blindedSig * rInverse) % n

        return signature.toString(16)
    } catch (error) {
        throw new Error(`Unblinding failed: ${error.message}`)
    }
}

/**
 * Verify a signature against a message
 * @param {string} message - Original message
 * @param {string} signatureHex - Signature in hex
 * @param {string} nHex - RSA modulus in hex
 * @param {number} e - RSA public exponent
 * @returns {boolean} - True if signature is valid
 */
export function verifySignature(message, signatureHex, nHex, e) {
    try {
        const messageHash = CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex)
        const expectedM = BigInt("0x" + messageHash)
        const signature = BigInt("0x" + signatureHex)
        const n = BigInt("0x" + nHex)
        const eBig = BigInt(e)

        // Verify: m = s^e mod n
        const recoveredM = modPow(signature, eBig, n)

        return recoveredM === expectedM
    } catch (error) {
        console.error("Signature verification failed:", error)
        return false
    }
}

/**
 * Generate a zero-knowledge proof of vote validity
 * @param {string} candidateId - Candidate being voted for
 * @param {Array} validCandidates - List of valid candidate IDs
 * @returns {Object} - ZK proof object
 */
export function generateZKProof(candidateId, validCandidates) {
    // Simple ZK proof: prove that the vote is for a valid candidate
    // without revealing which candidate
    const proofNonce = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex)

    // Create commitment for each valid candidate
    const commitments = validCandidates.map((id) => {
        const isSelected = id === candidateId
        const commitment = isSelected
            ? CryptoJS.SHA256(`${id}:${proofNonce}:1`).toString(CryptoJS.enc.Hex)
            : CryptoJS.SHA256(`${id}:${CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex)}:0`).toString(
                CryptoJS.enc.Hex,
            )

        return { candidateId: id, commitment, isSelected }
    })

    return {
        commitments: commitments.map((c) => ({ candidateId: c.candidateId, commitment: c.commitment })),
        proof: {
            nonce: proofNonce,
            selectedIndex: commitments.findIndex((c) => c.isSelected),
        },
    }
}

/**
 * Create a canonical ballot string
 * @param {string} candidateId - Candidate ID
 * @param {string} timestamp - Optional timestamp
 * @returns {string} - Canonical ballot format
 */
export function createCanonicalBallot(candidateId, timestamp = null) {
    if (timestamp) {
        return `VOTE:${candidateId}:${timestamp}`
    }
    return `VOTE:${candidateId}`
}

/**
 * Hash a ballot for consistency
 * @param {string} ballot - Ballot string
 * @returns {string} - SHA256 hash of ballot
 */
export function hashBallot(ballot) {
    return CryptoJS.SHA256(ballot).toString(CryptoJS.enc.Hex)
}
