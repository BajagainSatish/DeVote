const API_BASE_URL = 'http://localhost:8080'; // Adjust to your Go server port

class ApiService {
    constructor() {
        this.token = localStorage.getItem('adminToken');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        if (this.token && !endpoint.includes('/login')) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);

            // Log the response for debugging
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            // Check if response has content
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                throw new Error('Server returned non-JSON response');
            }

            console.log('Response data:', data); // Debug log

            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Auth methods
    async adminLogin(credentials) {
        try {
            console.log('Attempting login with:', credentials); // Debug log

            const response = await this.request('/admin/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: credentials.email,
                    password: credentials.password,
                }),
            });

            console.log('Login response:', response); // Debug log

            // Handle different response structures
            if (response && response.token) {
                this.token = response.token;
                localStorage.setItem('adminToken', response.token);
                return response;
            } else {
                throw new Error('Invalid response format: missing token');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('adminToken');
    }

    // Candidate methods
    async addCandidate(candidateData) {
        return this.request('/admin/candidates', {
            method: 'POST',
            body: JSON.stringify({
                id: candidateData.id,
                name: candidateData.name,
                bio: candidateData.bio,
                party: candidateData.party,
                age: parseInt(candidateData.age) || 0,
                imageUrl: candidateData.imageUrl || "", // We'll handle file upload later
            }),
        });
    }

    async getCandidates() {
        return this.request('/candidates', {
            method: 'GET',
        });
    }

    async getCandidate(id) {
        return this.request(`/candidates/${id}`, {
            method: 'GET',
        });
    }

    async updateCandidate(id, candidateData) {
        return this.request(`/admin/candidates/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: candidateData.name,
                bio: candidateData.bio,
                party: candidateData.party,
                age: parseInt(candidateData.age) || 0,
                imageUrl: candidateData.imageUrl || "",
            }),
        });
    }

    async deleteCandidate(id) {
        return this.request(`/admin/candidates/${id}`, {
            method: 'DELETE',
        });
    }
}

export default new ApiService();