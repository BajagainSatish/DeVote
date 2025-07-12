const API_BASE_URL = "http://localhost:8080"

class ApiService {
    constructor() {
        this.token = localStorage.getItem("adminToken")
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`
        const config = {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        }

        // Add token to all admin requests
        if (this.token && !endpoint.includes("/login")) {
            config.headers.Authorization = `Bearer ${this.token}`
        }

        try {
            const response = await fetch(url, config)

            // Handle 401 Unauthorized specifically
            if (response.status === 401) {
                this.logout()
                window.location.href = "/"
                throw new Error("Session expired. Please login again.")
            }
            // Check content type before parsing
            const contentType = response.headers.get("content-type")
            let data

            if (contentType && contentType.includes("application/json")) {
                data = await response.json()
                console.log("Response data:", data)

            } else {
                const text = await response.text()
                console.log("Non-JSON response:", text)

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`)
                }
                return { message: text }
            }

            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP ${response.status}`)
            }

            return data
        } catch (error) {
            console.error("API Request failed:", error)
            throw error
        }
    }
    // Update token when login succeeds
    setToken(token) {
        this.token = token
        localStorage.setItem("adminToken", token)
    }

    // Auth methods
    async adminLogin(credentials) {
        const response = await this.request("/admin/login", {
            method: "POST",
            body: JSON.stringify({
                username: credentials.email,
                password: credentials.password,
            }),
        })

        if (response && response.token) {
            this.setToken(response.token)
            return response
        } else {
            throw new Error("Invalid response format: missing token")
        }
    }

    logout() {
        this.token = null
        localStorage.removeItem("adminToken")
    }
    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token
    }

    // Party methods
    async getParties() {
        return this.request("/parties", { method: "GET" })
    }

    async addParty(partyData) {
        return this.request("/admin/parties", {
            method: "POST",
            body: JSON.stringify(partyData),
        })
    }

    async updateParty(id, partyData) {
        return this.request(`/admin/parties/${id}`, {
            method: "PUT",
            body: JSON.stringify(partyData),
        })
    }

    async deleteParty(id) {
        return this.request(`/admin/parties/${id}`, {
            method: "DELETE",
        })
    }

    // Candidate methods
    async addCandidate(candidateData) {
        return this.request("/admin/candidates", {
            method: "POST",
            body: JSON.stringify({
                id: candidateData.id,
                name: candidateData.name,
                bio: candidateData.bio,
                partyId: candidateData.partyId,
                age: Number.parseInt(candidateData.age) || 0,
                imageUrl: candidateData.imageUrl || "",
            }),
        })
    }

    async getCandidates() {
        return this.request("/candidates", { method: "GET" })
    }

    async updateCandidate(id, candidateData) {
        return this.request(`/admin/candidates/${id}`, {
            method: "PUT",
            body: JSON.stringify({
                name: candidateData.name,
                bio: candidateData.bio,
                partyId: candidateData.partyId,
                age: Number.parseInt(candidateData.age) || 0,
                imageUrl: candidateData.imageUrl || "",
            }),
        })
    }

    async deleteCandidate(id) {
        return this.request(`/admin/candidates/${id}`, {
            method: "DELETE",
        })
    }

    // Election management methods
    async startElection(electionData) {
        return this.request("/admin/election/start", {
            method: "POST",
            body: JSON.stringify(electionData),
        })
    }

    async stopElection() {
        return this.request("/admin/election/stop", {
            method: "POST",
        })
    }

    async getElectionStatus() {
        return this.request("/election/status", { method: "GET" })
    }

    async getElectionStatistics() {
        return this.request("/admin/election/statistics", { method: "GET" })
    }

    async getElectionResults() {
        return this.request("/election/results", { method: "GET" })
    }

    // User/Voter management methods
    async getUsers() {
        return this.request("/admin/users", { method: "GET" })
    }

    async getUser(id) {
        return this.request(`/admin/users/${id}`, { method: "GET" })
    }

    async updateUser(id, userData) {
        return this.request(`/admin/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(userData),
        })
    }

    async deleteUser(id) {
        return this.request(`/admin/users/${id}`, {
            method: "DELETE",
        })
    }

    async getRegisteredVoters() {
        return this.request("/admin/registered-voters", { method: "GET" })
    }

    async deleteRegisteredVoter(voterID) {
        return this.request(`/admin/registered-voters/${voterID}`, {
            method: "DELETE",
        })
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

export default new ApiService()
