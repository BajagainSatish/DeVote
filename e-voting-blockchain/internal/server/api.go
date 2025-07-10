package server

import (
	"e-voting-blockchain/blockchain" // Blockchain logic
	"e-voting-blockchain/contracts"  // Election contract
	"encoding/json"                  // JSON encoding/decoding
	"net/http"                       // HTTP server

	"github.com/gorilla/mux"
)

// Global election and blockchain variables (only 1 election for simplicity)
// var election = contracts.NewElection([]string{"Ram", "Shyam"})

var election *contracts.Election

func init() {
	loaded, err := contracts.LoadElection()
	if err != nil {
		// File doesn't exist or failed to load — start fresh
		election = contracts.NewElection()
		_ = election.SaveElection()
	} else {
		election = loaded
	}
}

var chain = blockchain.NewBlockchain()

// HandleVote receives a POST request to cast a vote.
func HandleVote(w http.ResponseWriter, r *http.Request) {
	type VoteRequest struct {
		VoterID     string
		Name        string
		DOB         string
		CandidateID string
	}

	var req VoteRequest

	// Decode JSON request body into the VoteRequest struct
	_ = json.NewDecoder(r.Body).Decode(&req)

	// Load valid voter database
	db, err := contracts.LoadVoterDatabase()
	if err != nil {
		http.Error(w, "Failed to load voter registry", http.StatusInternalServerError)
		return
	}

	// Validate voter
	if !db.IsValid(req.VoterID, req.Name, req.DOB) {
		http.Error(w, "Invalid voter details", http.StatusUnauthorized)
		return
	}

	// Check if already voted
	err = election.Vote(req.VoterID, req.CandidateID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Create a transaction and add it to the blockchain
	tx := blockchain.NewTransaction(req.VoterID, req.CandidateID, "VOTE")
	chain.AddBlock([]blockchain.Transaction{tx})

	// Save updated election state
	_ = election.SaveElection()

	// Respond with success
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "vote accepted"})
}

// HandleTally handles GET requests to view current vote counts.
func HandleTally(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(election.Tally())
}

// get all candidates
func HandleListCandidates(w http.ResponseWriter, r *http.Request) {
	// Set proper JSON content type
	w.Header().Set("Content-Type", "application/json")

	candidates := election.ListCandidates()
	if err := json.NewEncoder(w).Encode(candidates); err != nil {
		http.Error(w, "Failed to encode candidates", http.StatusInternalServerError)
		return
	}
}

func HandleGetCandidate(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	candidate, err := election.GetCandidate(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	// Set proper JSON content type
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(candidate); err != nil {
		http.Error(w, "Failed to encode candidate", http.StatusInternalServerError)
		return
	}
}

// Update HandleAddCandidate function
func HandleAddCandidate(w http.ResponseWriter, r *http.Request) {
	type Req struct {
		ID       string `json:"id"`
		Name     string `json:"name"`
		Bio      string `json:"bio"`
		Party    string `json:"party"`
		Age      int    `json:"age"`
		ImageURL string `json:"imageUrl,omitempty"`
	}

	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.ID == "" || req.Name == "" {
		http.Error(w, "ID and Name are required", http.StatusBadRequest)
		return
	}

	err := election.AddCandidate(req.ID, req.Name, req.Bio, req.Party, req.Age, req.ImageURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Add blockchain transaction
	payload := "ADD_CANDIDATE:" + req.Name + ":" + req.Party
	tx := blockchain.NewTransaction("admin", req.ID, payload)
	chain.AddBlock([]blockchain.Transaction{tx})

	_ = election.SaveElection()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "candidate added"})
}

// Update HandleUpdateCandidate function
func HandleUpdateCandidate(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	type Req struct {
		Name     string `json:"name"`
		Bio      string `json:"bio"`
		Party    string `json:"party"`
		Age      int    `json:"age"`
		ImageURL string `json:"imageUrl,omitempty"`
	}

	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	err := election.UpdateCandidate(id, req.Name, req.Bio, req.Party, req.Age, req.ImageURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	// Log update in blockchain
	payload := "UPDATE_CANDIDATE:" + req.Name + ":" + req.Party
	tx := blockchain.NewTransaction("admin", id, payload)
	chain.AddBlock([]blockchain.Transaction{tx})

	_ = election.SaveElection()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "candidate updated"})
}

// Update HandleDeleteCandidate function
func HandleDeleteCandidate(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	err := election.RemoveCandidate(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	// Record removal in blockchain
	tx := blockchain.NewTransaction("admin", id, "REMOVE_CANDIDATE")
	chain.AddBlock([]blockchain.Transaction{tx})

	_ = election.SaveElection()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "candidate removed"})
}
