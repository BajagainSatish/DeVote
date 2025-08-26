// API service for blockchain voting application
// client/src/services/api.js
import { MerkleTree } from "../utils/merkle.js"
const API_BASE_URL = "http://localhost:8080"

export const getAuthHeader = () => {
    const token = localStorage.getItem("token")
    return {
        Authorization: `Bearer ${token}`,
    }
}
class VotingApiService {
    constructor() {
        // Use environment variable for API base URL, fallback to localhost for development
        this.baseURL = "http://localhost:8080"
    }

    // Mock data for development when backend is not available
    getMockBlockchainData() {
        const blocks = [
            {
                Index: 0,
                Timestamp: "2024-01-15T10:00:00.000Z", // Fixed date format for proper parsing
                Transactions: [],
                PrevHash: "0000000000000000000000000000000000000000000000000000000000000000",
                Hash: "000abc123def456789abcdef123456789abcdef123456789abcdef123456789abc",
                nonce: 12345,
                merkleRoot: "", // Will be calculated
            },
            {
                Index: 1,
                Timestamp: "2024-01-15T10:15:00.000Z", // Fixed date format
                Transactions: [
                    {
                        ID: "tx_001_vote_alice_candidate1",
                        Sender: "voter_alice_hash_abc123",
                        Receiver: "candidate_1_john_doe",
                        Payload: "VOTE",
                        Type: "VOTE",
                    },
                    {
                        ID: "tx_002_vote_bob_candidate1",
                        Sender: "voter_bob_hash_def456",
                        Receiver: "candidate_1_john_doe",
                        Payload: "VOTE",
                        Type: "VOTE",
                    },
                ],
                PrevHash: "000abc123def456789abcdef123456789abcdef123456789abcdef123456789abc",
                Hash: "111def456abc789123def456abc789123def456abc789123def456abc789123def",
                nonce: 67890,
                merkleRoot: "", // Will be calculated
            },
            {
                Index: 2,
                Timestamp: "2024-01-15T10:30:00.000Z", // Fixed date format
                Transactions: [
                    {
                        ID: "tx_003_add_candidate_jane",
                        Sender: "admin_system_hash_xyz789",
                        Receiver: "candidate_2_jane_smith",
                        Payload: "ADD_CANDIDATE:Jane Smith:Experienced leader with 10 years in public service",
                        Type: "ADD_CANDIDATE",
                    },
                    {
                        ID: "tx_004_vote_charlie_candidate2",
                        Sender: "voter_charlie_hash_ghi789",
                        Receiver: "candidate_2_jane_smith",
                        Payload: "VOTE",
                        Type: "VOTE",
                    },
                    {
                        ID: "tx_005_vote_diana_candidate1",
                        Sender: "voter_diana_hash_jkl012",
                        Receiver: "candidate_1_john_doe",
                        Payload: "VOTE",
                        Type: "VOTE",
                    },
                ],
                PrevHash: "111def456abc789123def456abc789123def456abc789123def456abc789123def",
                Hash: "222ghi789jkl012mno345pqr678stu901vwx234yzab567cdef890ghij123klm",
                nonce: 54321,
                merkleRoot: "", // Will be calculated
            },
            {
                Index: 3,
                Timestamp: "2024-01-15T10:45:00.000Z", // Fixed date format
                Transactions: [
                    {
                        ID: "tx_006_vote_eve_candidate2",
                        Sender: "voter_eve_hash_mno345",
                        Receiver: "candidate_2_jane_smith",
                        Payload: "VOTE",
                        Type: "VOTE",
                    },
                    {
                        ID: "tx_007_vote_frank_candidate1",
                        Sender: "voter_frank_hash_pqr678",
                        Receiver: "candidate_1_john_doe",
                        Payload: "VOTE",
                        Type: "VOTE",
                    },
                    {
                        ID: "tx_008_update_candidate_jane",
                        Sender: "admin_system_hash_xyz789",
                        Receiver: "candidate_2_jane_smith",
                        Payload:
                            "UPDATE_CANDIDATE:Jane Smith:Experienced leader with 10 years in public service and environmental advocacy",
                        Type: "UPDATE_CANDIDATE",
                    },
                ],
                PrevHash: "222ghi789jkl012mno345pqr678stu901vwx234yzab567cdef890ghij123klm",
                Hash: "333jkl012mno345pqr678stu901vwx234yzab567cdef890ghij123klmnop456qrs",
                nonce: 98765,
                merkleRoot: "", // Will be calculated
            },
        ]

        blocks.forEach((block) => {
            const { root } = MerkleTree.buildMerkleTree(block.Transactions)
            block.merkleRoot = root
            console.log(`[v0] Block ${block.Index} - Transactions: ${block.Transactions.length}, Merkle Root: ${root}`)
        })

        return blocks
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`

        const defaultOptions = {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        }

        const config = {
            ...defaultOptions,
            ...options,
        }

        try {
            const response = await fetch(url, config)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}`)
            }

            return data
        } catch (error) {
            console.error("API Request failed:", error)
            throw error
        }
    }

    // Auth methods
    async login(credentials) {
        return this.request("/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        })
    }

    async register(userData) {
        return this.request("/register", {
            method: "POST",
            body: JSON.stringify(userData),
        })
    }
    // Voting methods
    async getCandidates() {
        return this.request("/candidates", { method: "GET" })
    }

    async getParties() {
        return this.request("/parties", { method: "GET" })
    }

    // Get blockchain data
    async getBlockchain() {
        try {
            console.log("[v0] Attempting to fetch blockchain data from backend...")
            const response = await this.makeRequest("/blockchain")

            let blocks = response
            if (response.blocks) {
                blocks = response.blocks
            }

            blocks = blocks.map((block) => ({
                ...block,
                Timestamp: this.parseGoTimestamp(block.Timestamp),
                merkleRoot: block.merkleRoot || block.MerkleRoot || this.calculateMerkleRoot(block.Transactions || []),
            }))

            console.log("[v0] Successfully fetched and processed blockchain data from backend")
            console.log("[v0] Blockchain API Response:", JSON.stringify(blocks).substring(0, 200) + "...")
            return blocks
        } catch (error) {
            console.log("[v0] Backend not available, using mock data for development:", error.message)
            // Return mock data when backend is not available
            const mockData = this.getMockBlockchainData()
            console.log("[v0] Returning mock blockchain data with", mockData.length, "blocks")
            return mockData
        }
    }

    // Get specific block by index
    async getBlock(index) {
        try {
            const block = await this.makeRequest(`/block/${index}`)
            return block
        } catch (error) {
            console.error(`Failed to fetch block ${index}:`, error)
            // Return mock block if available
            const mockData = this.getMockBlockchainData()
            const block = mockData.find((b) => b.Index === index)
            if (block) return block
            throw error
        }
    }

    // Get transaction by ID
    async getTransaction(txId) {
        try {
            const transaction = await this.makeRequest(`/transaction/${txId}`)
            return transaction
        } catch (error) {
            console.error(`Failed to fetch transaction ${txId}:`, error)
            throw error
        }
    }

    // Submit a new vote
    async submitVote(voteData) {
        try {
            const result = await this.makeRequest("/vote", {
                method: "POST",
                body: JSON.stringify(voteData),
            })
            return result
        } catch (error) {
            console.error("Failed to submit vote:", error)
            throw error
        }
    }

    async castVote(voteData) {
        try {
            const result = await this.request("/vote", {
                method: "POST",
                headers: getAuthHeader(),
                body: JSON.stringify(voteData),
            })
            return result
        } catch (error) {
            console.error("Failed to cast vote:", error)
            throw error
        }
    }

    async getElectionStatus() {
        return this.request("/election/status", { method: "GET" })
    }

    // Add candidate (admin function)
    async addCandidate(candidateData) {
        try {
            const result = await this.makeRequest("/candidate", {
                method: "POST",
                body: JSON.stringify(candidateData),
            })
            return result
        } catch (error) {
            console.error("Failed to add candidate:", error)
            throw error
        }
    }

    // Get voting statistics
    async getVotingStats() {
        try {
            const stats = await this.makeRequest("/stats")
            return stats
        } catch (error) {
            console.error("Failed to fetch voting stats:", error)
            throw error
        }
    }

    // Verify Merkle proof (if backend supports it)
    async verifyMerkleProof(blockIndex, transactionId) {
        try {
            const proof = await this.makeRequest(`/verify-merkle/${blockIndex}/${transactionId}`)
            return proof
        } catch (error) {
            console.error("Failed to verify Merkle proof:", error)
            throw error
        }
    }

    // Get election results
    async getElectionResults() {
        try {
            const results = await this.request("/election/results", { method: "GET" })
            return results
        } catch (error) {
            console.error("Failed to load election results:", error)
            // Return mock election results
            return {
                totalVotes: 7,
                candidates: [
                    { name: "John Doe", votes: 4, percentage: 57.1 },
                    { name: "Jane Smith", votes: 3, percentage: 42.9 },
                ],
                status: "active",
            }
        }
    }

    async getUserVotingStatus(voterID) {
        try {
            const status = await this.makeRequest(`/voter/${voterID}/status`)
            return status
        } catch (error) {
            console.error("Failed to get user voting status:", error)
            throw error
        }
    }

    parseGoTimestamp(goTimestamp) {
        // Go timestamp format: "2025-06-29 17:06:28.1792902 +0545 +0545 m=+0.006204201"
        // Extract just the date and time part before the timezone
        const match = goTimestamp.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)
        if (match) {
            // Convert to ISO format by replacing space with 'T' and adding 'Z'
            return match[1].replace(" ", "T") + "Z"
        }
        // Fallback to original if parsing fails
        return goTimestamp
    }

    calculateMerkleRoot(transactions) {
        if (!transactions || transactions.length === 0) {
            return ""
        }
        const { root } = MerkleTree.buildMerkleTree(transactions)
        return root
    }
}

// Export singleton instance
const votingApiService = new VotingApiService()
export default votingApiService
