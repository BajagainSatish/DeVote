// devote-admin/src/services/api.js

const API_BASE_URL = "http://localhost:8080";

class ApiService {
  constructor() {
    this.token = localStorage.getItem("adminToken");
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add token to all admin requests
    if (this.token && !endpoint.includes("/login")) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    console.log("Making request to:", url);
    console.log("Request config:", config);
    console.log("Request body:", options.body);

    try {
      const response = await fetch(url, config);

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        console.log("Unauthorized - clearing token and redirecting to login");
        this.logout();
        // window.location.href = "/" // this reloads page on 401 for login failures tesaile wrong credentials ma kei show nagari reload vako
        throw new Error("Session expired. Please login again.");
      }

      // Check content type before parsing
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log("Response data:", data);
      } else {
        const text = await response.text();
        console.log("Non-JSON response:", text);

        if (!response.ok) {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }

        return { message: text };
      }

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `HTTP ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
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

  // Rest of your methods remain the same...
  async getParties() {
    return this.request("/parties", { method: "GET" })
  }

  async addParty(partyData) {
    console.log("Adding party with data:", partyData);
    return this.request("/admin/parties", {
      method: "POST",
      body: JSON.stringify(partyData),
    });
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

  async startElection(electionData) {
    const electionWithId = {
      ...electionData,
      electionId: `election_${Date.now()}`, // Generate unique election ID
    }

    return this.request("/admin/election/start", {
      method: "POST",
      body: JSON.stringify(electionWithId),
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

  async getRegisteredUsers() {
    return this.request("/admin/registered-voters", { method: "GET" })
  }

  // User/Voter management methods (don't include addUser since admin shouldn't add voters)
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
    return this.request("/admin/registered-voters", { method: "GET" });
  }

  async deleteRegisteredVoter(voterID) {
    return this.request(`/admin/registered-voters/${voterID}`, {
      method: "DELETE",
    })
  }

  async resetAllVoterStatuses() {
    return this.request("/admin/election/reset-voter-statuses", {
      method: "POST",
    })
  }
}

export default new ApiService()
