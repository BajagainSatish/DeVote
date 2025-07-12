const API_BASE_URL = "http://localhost:8080"

export const getAuthHeader = () => {
    const token = localStorage.getItem("token")
    return {
        Authorization: `Bearer ${token}`,
    }
}

class VotingApiService {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`
        const config = {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
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

    async castVote(voteData) {
        return this.request("/vote", {
            method: "POST",
            headers: getAuthHeader(),
            body: JSON.stringify(voteData),
        })
    }

    async getElectionStatus() {
        return this.request("/election/status", { method: "GET" })
    }

    async getElectionResults() {
        return this.request("/election/results", { method: "GET" })
    }

    async getTally() {
        return this.request("/tally", { method: "GET" })
    }

    // Blockchain methods
    async getBlockchain() {
        return this.request("/blockchain", { method: "GET" })
    }

    async getTransactions(params = {}) {
        const queryString = new URLSearchParams(params).toString()
        const endpoint = queryString ? `/blockchain/transactions?${queryString}` : "/blockchain/transactions"
        return this.request(endpoint, { method: "GET" })
    }

    async getBlockchainStats() {
        return this.request("/blockchain/stats", { method: "GET" })
    }

    async getTransaction(id) {
        return this.request(`/blockchain/transaction/${id}`, { method: "GET" })
    }

    async getBlock(index) {
        return this.request(`/blockchain/block/${index}`, { method: "GET" })
    }

    async verifyBlockchain() {
        return this.request("/blockchain/verify", { method: "GET" })
    }

    // WebSocket connection for real-time updates
    connectWebSocket(onMessage) {
        const wsUrl = `ws://localhost:8080/blockchain/ws`
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
            console.log("WebSocket connected")
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (onMessage) {
                onMessage(data)
            }
        }

        ws.onerror = (error) => {
            console.error("WebSocket error:", error)
        }

        ws.onclose = () => {
            console.log("WebSocket disconnected")
        }

        return ws
    }
}

export default new VotingApiService()
