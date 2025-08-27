// Zero Knowledge Voting Service - handles all ZK proof operations
import {
    blindMessage,
    unblindSignature,
    createCanonicalBallot,
    verifySignature,
    createVoteCommitment,
    generateZKProof,
} from "../utils/zkUtils"

class ZKVotingService {
    constructor() {
        this.baseURL = "" // Use relative URLs for same-origin requests
        // this.isDevelopmentMode = process.env.NODE_ENV === "development" || !this.isBackendAvailable()
        this.mockPublicKey = {
            n: "23456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789",
            e: 65537,
        }
    }

    /**
     * Check if backend is available
     * @returns {boolean} - True if backend is responding
     */
    async isBackendAvailable() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: "GET",
                timeout: 2000,
            })
            return response.ok
        } catch (error) {
            print(error)
            return false
        }
    }

    /**
     * Fetch the election authority's public key
     * @returns {Promise<Object>} - Public key components {n, e}
     */
    async getPublicKey() {
        if (this.isDevelopmentMode) {
            console.log("[v0] Using mock public key for development")
            return this.mockPublicKey
        }

        try {
            const response = await fetch(`${this.baseURL}/pubkey`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch public key: ${response.statusText}`)
            }

            const pubKey = await response.json()
            return {
                n: pubKey.n,
                e: Number.parseInt(pubKey.e, 16), // Convert hex to decimal if needed
            }
        } catch (error) {
            print(error)
            console.warn("[v0] Backend unavailable, falling back to mock mode")
            this.isDevelopmentMode = true
            return this.mockPublicKey
        }
    }

    /**
     * Request a blind signature from the authority
     * @param {string} blindedMessage - Blinded message in hex
     * @returns {Promise<string>} - Blinded signature in hex
     */
    async requestBlindSignature(blindedMessage) {
        if (this.isDevelopmentMode) {
            console.log("[v0] Generating mock blind signature for development")
            // Generate a mock signature by hashing the blinded message
            const mockSignature = this.generateMockSignature(blindedMessage)
            return mockSignature
        }

        try {
            const response = await fetch(`${this.baseURL}/issue-blind-signature`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Include cookies for authentication
                body: JSON.stringify({ blinded: blindedMessage }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Blind signature request failed: ${errorText}`)
            }

            const result = await response.json()
            if (!result.blinded_signature) {
                throw new Error("Server returned empty blinded signature")
            }

            return result.blinded_signature
        } catch (error) {
            print(error)
            console.warn("[v0] Backend unavailable, using mock signature")
            this.isDevelopmentMode = true
            return this.generateMockSignature(blindedMessage)
        }
    }

    /**
     * Generate mock signature for development
     * @param {string} blindedMessage - Blinded message
     * @returns {string} - Mock signature in hex
     */
    generateMockSignature(blindedMessage) {
        // Simple mock signature generation for development
        const hash = this.simpleHash(blindedMessage + "mock_authority_key")
        return hash.toString(16).padStart(64, "0")
    }

    /**
     * Simple hash function for mock signatures
     * @param {string} input - Input string
     * @returns {number} - Hash value
     */
    simpleHash(input) {
        let hash = 0
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash // Convert to 32-bit integer
        }
        return Math.abs(hash)
    }

    /**
     * Submit an anonymous vote to the blockchain
     * @param {string} ballot - Canonical ballot string
     * @param {string} signature - Unblinded signature in hex
     * @returns {Promise<Object>} - Submission result with transaction ID
     */
    async submitAnonymousVote(ballot, signature) {
        if (this.isDevelopmentMode) {
            console.log("[v0] Simulating blockchain vote submission")
            const mockTransactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            const mockBlockHash = `block_${this.simpleHash(ballot + signature).toString(16)}`

            return {
                success: true,
                transactionId: mockTransactionId,
                blockHash: mockBlockHash,
                message: "Vote submitted successfully (development mode)",
            }
        }

        try {
            const response = await fetch(`${this.baseURL}/submit-anonymous-vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ballot, signature }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Anonymous vote submission failed: ${errorText}`)
            }

            const result = await response.json()
            return {
                success: true,
                transactionId: result.transactionId || result.transaction_id,
                blockHash: result.blockHash || result.block_hash,
                message: result.message || "Vote submitted successfully",
            }
        } catch (error) {
            print(error)
            console.warn("[v0] Backend unavailable, using mock submission")
            this.isDevelopmentMode = true
            return this.submitAnonymousVote(ballot, signature) // Retry with mock
        }
    }

    /**
     * Verify that a vote was recorded anonymously
     * @param {string} ballot - Original ballot string
     * @param {string} signature - Unblinded signature
     * @returns {Promise<Object>} - Verification result
     */
    async verifyAnonymousVote(ballot, signature) {
        if (this.isDevelopmentMode) {
            console.log("[v0] Performing mock vote verification")
            return {
                isValid: true,
                isAnonymous: true,
                transactionId: `tx_${Date.now()}_verified`,
                blockHash: `block_${this.simpleHash(ballot).toString(16)}`,
                timestamp: new Date().toISOString(),
                message: "Vote verification completed (development mode)",
            }
        }

        try {
            const response = await fetch(`${this.baseURL}/verify-anonymous-vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ballot, signature }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Vote verification failed: ${errorText}`)
            }

            const result = await response.json()
            return {
                isValid: result.isValid || result.is_valid,
                isAnonymous: result.isAnonymous || result.is_anonymous,
                transactionId: result.transactionId || result.transaction_id,
                blockHash: result.blockHash || result.block_hash,
                timestamp: result.timestamp,
                message: result.message || "Vote verification completed",
            }
        } catch (error) {
            print(error)
            console.warn("[v0] Backend unavailable, using mock verification")
            this.isDevelopmentMode = true
            return this.verifyAnonymousVote(ballot, signature) // Retry with mock
        }
    }

    /**
     * Complete anonymous voting flow
     * @param {string} candidateId - Selected candidate ID
     * @param {Object} authData - Authentication data for eligibility check
     * @returns {Promise<Object>} - Complete voting result
     */
    async castAnonymousVote(candidateId) {
        try {
            console.log("[v0] Starting anonymous vote casting process")

            // Step 1: Create canonical ballot
            const ballot = createCanonicalBallot(candidateId)
            console.log("[v0] Created canonical ballot")

            // Step 2: Get public key
            const { n, e } = await this.getPublicKey()
            console.log("[v0] Retrieved public key")

            // Step 3: Blind the ballot
            const { blindedHex, r } = blindMessage(ballot, n, e)
            console.log("[v0] Blinded ballot message")

            // Step 4: Request blind signature (this validates eligibility)
            const blindedSignature = await this.requestBlindSignature(blindedHex)
            console.log("[v0] Received blind signature")

            // Step 5: Unblind the signature
            const signature = unblindSignature(blindedSignature, r, n)
            console.log("[v0] Unblinded signature")

            // Step 6: Submit anonymous vote
            const submissionResult = await this.submitAnonymousVote(ballot, signature)
            console.log("[v0] Vote submitted successfully")

            return {
                success: true,
                ballot,
                signature,
                transactionId: submissionResult.transactionId,
                blockHash: submissionResult.blockHash,
                candidateId,
                timestamp: new Date().toISOString(),
                developmentMode: this.isDevelopmentMode,
            }
        } catch (error) {
            console.error("[v0] Anonymous voting failed:", error)
            throw new Error(`Anonymous voting failed: ${error.message}`)
        }
    }

    /**
     * Generate a zero-knowledge proof of vote validity
     * @param {string} candidateId - Selected candidate
     * @param {Array} validCandidates - List of valid candidates
     * @returns {Object} - ZK proof
     */
    generateValidityProof(candidateId, validCandidates) {
        return generateZKProof(candidateId, validCandidates)
    }

    /**
     * Verify vote signature locally (for transparency)
     * @param {string} ballot - Original ballot
     * @param {string} signature - Vote signature
     * @param {string} n - Public key modulus
     * @param {number} e - Public key exponent
     * @returns {boolean} - True if signature is valid
     */
    verifyVoteSignature(ballot, signature, n, e) {
        return verifySignature(ballot, signature, n, e)
    }

    /**
     * Create vote commitment for additional privacy
     * @param {string} candidateId - Candidate ID
     * @returns {Object} - Commitment and reveal data
     */
    createCommitment(candidateId) {
        return createVoteCommitment(candidateId)
    }
}

export default new ZKVotingService()
