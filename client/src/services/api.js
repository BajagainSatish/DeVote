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
}

export default new VotingApiService()
