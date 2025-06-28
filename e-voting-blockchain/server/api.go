package server

import (
	"e-voting-blockchain/blockchain" // Blockchain logic
	"e-voting-blockchain/contracts"  // Election contract
	"encoding/json"                  // JSON encoding/decoding
	"net/http"                       // HTTP server
)

// Global election and blockchain variables (only 1 election for simplicity)
// var election = contracts.NewElection([]string{"Ram", "Shyam"})

var election *contracts.Election

func init() {
	loaded, err := contracts.LoadElection()
	if err != nil {
		// File doesn't exist or failed to load — start fresh
		election = contracts.NewElection([]string{"Ram", "Shyam"})
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
		CandidateID string
	}

	var req VoteRequest

	// Decode JSON request body into the VoteRequest struct
	_ = json.NewDecoder(r.Body).Decode(&req)

	// Let the smart contract handle validation and voting
	err := election.Vote(req.VoterID, req.CandidateID)
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
