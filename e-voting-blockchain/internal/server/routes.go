package server

import (
	"net/http"

	"github.com/gorilla/mux"
)

// SetupRoutes sets up all HTTP routes for the API.
func SetupRoutes() http.Handler {
	r := mux.NewRouter()

	// Public (unauthenticated) endpoints
	r.HandleFunc("/register", HandleUserRegister).Methods("POST")
	r.HandleFunc("/vote", HandleVote).Methods("POST")
	r.HandleFunc("/tally", HandleTally).Methods("GET")
	r.HandleFunc("/candidates", HandleListCandidates).Methods("GET")
	r.HandleFunc("/candidates/{id}", HandleGetCandidate).Methods("GET")
	r.HandleFunc("/admin/login", HandleAdminLogin).Methods("POST")
	r.HandleFunc("/login", HandleUserLogin).Methods("POST")

	// Admin-only routes (require token)
	admin := r.PathPrefix("/admin").Subrouter()
	admin.Use(AuthMiddleware)

	admin.HandleFunc("/candidates", HandleAddCandidate).Methods("POST")
	admin.HandleFunc("/candidates/{id}", HandleUpdateCandidate).Methods("PUT")
	admin.HandleFunc("/candidates/{id}", HandleDeleteCandidate).Methods("DELETE")

	return CorsMiddleware(r) //wrap with cors middleware
}
