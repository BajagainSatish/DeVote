package server

import (
	"net/http"

	"github.com/gorilla/mux"
)

func SetupRoutes() http.Handler {
	r := mux.NewRouter()

	// Public endpoints
	r.HandleFunc("/register", HandleUserRegister).Methods("POST", "OPTIONS")
	r.HandleFunc("/vote", HandleVote).Methods("POST", "OPTIONS")
	r.HandleFunc("/tally", HandleTally).Methods("GET", "OPTIONS")
	r.HandleFunc("/candidates", HandleListCandidates).Methods("GET", "OPTIONS")
	r.HandleFunc("/candidates/{id}", HandleGetCandidate).Methods("GET", "OPTIONS")
	r.HandleFunc("/admin/login", HandleAdminLogin).Methods("POST", "OPTIONS")
	r.HandleFunc("/login", HandleUserLogin).Methods("POST", "OPTIONS")
	r.HandleFunc("/parties", HandleListParties).Methods("GET", "OPTIONS")
	r.HandleFunc("/election/status", HandleElectionStatus).Methods("GET", "OPTIONS")
	r.HandleFunc("/election/results", HandleElectionResults).Methods("GET", "OPTIONS")

	// Blockchain endpoints (public for transparency)
	r.HandleFunc("/blockchain", HandleGetBlockchain).Methods("GET", "OPTIONS")
	r.HandleFunc("/blockchain/transactions", HandleGetTransactions).Methods("GET", "OPTIONS")
	r.HandleFunc("/blockchain/stats", HandleGetBlockchainStats).Methods("GET", "OPTIONS")
	r.HandleFunc("/blockchain/transaction/{id}", HandleGetTransaction).Methods("GET", "OPTIONS")
	r.HandleFunc("/blockchain/block/{index}", HandleGetBlock).Methods("GET", "OPTIONS")
	r.HandleFunc("/blockchain/verify", HandleVerifyBlockchain).Methods("GET", "OPTIONS")
	r.HandleFunc("/blockchain/ws", HandleWebSocket).Methods("GET")

	// Admin-only routes
	admin := r.PathPrefix("/admin").Subrouter()
	admin.Use(AuthMiddleware)

	// Candidate management
	admin.HandleFunc("/candidates", HandleAddCandidate).Methods("POST", "OPTIONS")
	admin.HandleFunc("/candidates/{id}", HandleUpdateCandidate).Methods("PUT", "OPTIONS")
	admin.HandleFunc("/candidates/{id}", HandleDeleteCandidate).Methods("DELETE", "OPTIONS")

	// Party management
	admin.HandleFunc("/parties", HandleAddParty).Methods("POST", "OPTIONS")
	admin.HandleFunc("/parties/{id}", HandleUpdateParty).Methods("PUT", "OPTIONS")
	admin.HandleFunc("/parties/{id}", HandleDeleteParty).Methods("DELETE", "OPTIONS")

	// User/Voter management
	admin.HandleFunc("/users", HandleAddUser).Methods("POST", "OPTIONS")
	admin.HandleFunc("/users", HandleListUsers).Methods("GET", "OPTIONS")
	admin.HandleFunc("/users/{id}", HandleGetUser).Methods("GET", "OPTIONS")
	admin.HandleFunc("/users/{id}", HandleUpdateUser).Methods("PUT", "OPTIONS")
	admin.HandleFunc("/users/{id}", HandleDeleteUser).Methods("DELETE", "OPTIONS")
	admin.HandleFunc("/registered-voters", HandleGetRegisteredVoters).Methods("GET", "OPTIONS")
	admin.HandleFunc("/registered-voters/{voterID}", HandleDeleteRegisteredVoter).Methods("DELETE", "OPTIONS")

	// Election management
	admin.HandleFunc("/election/start", HandleStartElection).Methods("POST", "OPTIONS")
	admin.HandleFunc("/election/stop", HandleStopElection).Methods("POST", "OPTIONS")
	admin.HandleFunc("/election/statistics", HandleElectionStatistics).Methods("GET", "OPTIONS")

	return CorsMiddleware(r)
}
