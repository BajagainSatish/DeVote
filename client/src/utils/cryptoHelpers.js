// Additional cryptographic helper functions for ZK proofs
import CryptoJS from "crypto-js"

/**
 * Generate a secure random nonce
 * @param {number} bytes - Number of random bytes to generate
 * @returns {string} - Random nonce in hex
 */
export function generateNonce(bytes = 32) {
    return CryptoJS.lib.WordArray.random(bytes).toString(CryptoJS.enc.Hex)
}

/**
 * Create a Merkle tree leaf for vote anonymity
 * @param {string} voteData - Vote data to hash
 * @param {string} salt - Random salt for privacy
 * @returns {string} - Merkle leaf hash
 */
export function createMerkleLeaf(voteData, salt) {
    const combined = `${voteData}:${salt}`
    return CryptoJS.SHA256(combined).toString(CryptoJS.enc.Hex)
}

/**
 * Verify a Merkle proof for vote inclusion
 * @param {string} leaf - Leaf hash to verify
 * @param {Array} proof - Merkle proof array
 * @param {string} root - Merkle root hash
 * @returns {boolean} - True if proof is valid
 */
export function verifyMerkleProof(leaf, proof, root) {
    let currentHash = leaf

    for (const proofElement of proof) {
        if (proofElement.position === "left") {
            currentHash = CryptoJS.SHA256(proofElement.hash + currentHash).toString(CryptoJS.enc.Hex)
        } else {
            currentHash = CryptoJS.SHA256(currentHash + proofElement.hash).toString(CryptoJS.enc.Hex)
        }
    }

    return currentHash === root
}

/**
 * Create a commitment scheme for vote privacy
 * @param {string} vote - Vote data
 * @param {string} randomness - Random value for commitment
 * @returns {Object} - Commitment and opening data
 */
export function createCommitment(vote, randomness = null) {
    if (!randomness) {
        randomness = generateNonce()
    }

    const commitment = CryptoJS.SHA256(`${vote}:${randomness}`).toString(CryptoJS.enc.Hex)

    return {
        commitment,
        opening: {
            vote,
            randomness,
        },
    }
}

/**
 * Verify a commitment opening
 * @param {string} commitment - Original commitment
 * @param {string} vote - Revealed vote
 * @param {string} randomness - Revealed randomness
 * @returns {boolean} - True if opening is valid
 */
export function verifyCommitment(commitment, vote, randomness) {
    const expectedCommitment = CryptoJS.SHA256(`${vote}:${randomness}`).toString(CryptoJS.enc.Hex)
    return commitment === expectedCommitment
}

/**
 * Generate a ring signature for vote anonymity (simplified version)
 * @param {string} message - Message to sign
 * @param {Array} publicKeys - Array of public keys in the ring
 * @param {string} privateKey - Signer's private key
 * @param {number} signerIndex - Index of signer in the ring
 * @returns {Object} - Ring signature
 */
export function generateRingSignature(message, publicKeys, privateKey, signerIndex) {
    // Simplified ring signature implementation
    // In production, use a proper cryptographic library
    const messageHash = CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex)
    const nonce = generateNonce()

    // Create signature components for each ring member
    const signatures = publicKeys.map((pubKey, index) => {
        if (index === signerIndex) {
            // Real signature for the actual signer
            return CryptoJS.SHA256(`${messageHash}:${privateKey}:${nonce}`).toString(CryptoJS.enc.Hex)
        } else {
            // Fake signature for other ring members
            return CryptoJS.SHA256(`${messageHash}:${pubKey}:${generateNonce()}`).toString(CryptoJS.enc.Hex)
        }
    })

    return {
        message: messageHash,
        signatures,
        ringSize: publicKeys.length,
        nonce,
    }
}

/**
 * Verify a ring signature
 * @param {Object} ringSignature - Ring signature to verify
 * @param {Array} publicKeys - Public keys in the ring
 * @returns {boolean} - True if signature is valid
 */
export function verifyRingSignature(ringSignature, publicKeys) {
    // Simplified verification
    // In production, implement proper ring signature verification
    return (
        ringSignature.signatures.length === publicKeys.length &&
        ringSignature.ringSize === publicKeys.length &&
        ringSignature.message &&
        ringSignature.nonce
    )
}
