package main

import (
	"e-voting-blockchain/server" // Import the server with handlers
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

// Entry point of the application
func main() {
	r := mux.NewRouter()

	// Voter endpoints
	r.HandleFunc("/vote", server.HandleVote).Methods("POST")
	r.HandleFunc("/tally", server.HandleTally).Methods("GET")

	// Admin endpoints
	r.HandleFunc("/admin/candidates", server.HandleListCandidates).Methods("GET")
	r.HandleFunc("/admin/candidates/{id}", server.HandleGetCandidate).Methods("GET")
	r.HandleFunc("/admin/candidates", server.HandleAddCandidate).Methods("POST")
	r.HandleFunc("/admin/candidates/{id}", server.HandleUpdateCandidate).Methods("PUT")
	r.HandleFunc("/admin/candidates/{id}", server.HandleDeleteCandidate).Methods("DELETE")

	// Start the web server
	log.Println("Server started on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r)) // Start listening for HTTP requests
}
