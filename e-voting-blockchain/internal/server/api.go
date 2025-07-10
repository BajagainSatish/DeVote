package server

import (
	"e-voting-blockchain/blockchain"
	"e-voting-blockchain/contracts"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

// Global election and blockchain variables (only 1 election for simplicity)
var election *contracts.Election

func init() {
	log.Println("Initializing election...")
	loaded, err := contracts.LoadElection()
	if err != nil {
		log.Printf("Failed to load election, creating new one: %v", err)
		// File doesn't exist or failed to load — start fresh
		election = contracts.NewElection()
		if saveErr := election.SaveElection(); saveErr != nil {
			log.Printf("Failed to save new election: %v", saveErr)
		}
	} else {
		election = loaded
		log.Println("Election loaded successfully")
	}
}

var chain = blockchain.NewBlockchain()

// HandleVote receives a POST request to cast a vote.
func HandleVote(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleVote called")
	w.Header().Set("Content-Type", "application/json")

	type VoteRequest struct {
		VoterID     string
		Name        string
		DOB         string
		CandidateID string
	}

	var req VoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	// Load valid voter database
	db, err := contracts.LoadVoterDatabase()
	if err != nil {
		log.Printf("Failed to load voter registry: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to load voter registry"})
		return
	}

	// Validate voter
	if !db.IsValid(req.VoterID, req.Name, req.DOB) {
		log.Println("Invalid voter details")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid voter details"})
		return
	}

	// Check if already voted
	err = election.Vote(req.VoterID, req.CandidateID)
	if err != nil {
		log.Printf("Failed to vote: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Create a transaction and add it to the blockchain
	tx := blockchain.NewTransaction(req.VoterID, req.CandidateID, "VOTE")
	chain.AddBlock([]blockchain.Transaction{tx})

	// Save updated election state
	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusCreated)
	response := map[string]string{"status": "vote accepted"}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
	log.Println("HandleVote completed successfully")
}

// HandleTally handles GET requests to view current vote counts.
func HandleTally(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleTally called")
	w.Header().Set("Content-Type", "application/json")

	if election == nil {
		log.Println("Election is nil!")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Election not initialized"})
		return
	}

	tally := election.Tally()
	log.Printf("Tally: %v", tally)

	if err := json.NewEncoder(w).Encode(tally); err != nil {
		log.Printf("Failed to encode tally: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode tally"})
		return
	}
	log.Println("HandleTally completed successfully")
}

// get all candidates
func HandleListCandidates(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleListCandidates called")
	w.Header().Set("Content-Type", "application/json")

	if election == nil {
		log.Println("Election is nil!")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Election not initialized"})
		return
	}

	candidates := election.ListCandidates()
	log.Printf("Found %d candidates", len(candidates))

	if candidates == nil {
		candidates = []contracts.Candidate{}
	}

	if err := json.NewEncoder(w).Encode(candidates); err != nil {
		log.Printf("Failed to encode candidates: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode candidates"})
		return
	}
	log.Println("HandleListCandidates completed successfully")
}

func HandleGetCandidate(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleGetCandidate called")
	w.Header().Set("Content-Type", "application/json")

	id := mux.Vars(r)["id"]
	candidate, err := election.GetCandidate(id)
	if err != nil {
		log.Printf("Failed to get candidate: %v", err)
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	if err := json.NewEncoder(w).Encode(candidate); err != nil {
		log.Printf("Failed to encode candidate: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode candidate"})
		return
	}
	log.Println("HandleGetCandidate completed successfully")
}

// Update HandleAddCandidate to use partyID
func HandleAddCandidate(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleAddCandidate called")
	w.Header().Set("Content-Type", "application/json")

	// Check if election is initialized
	if election == nil {
		log.Println("Election is nil in HandleAddCandidate!")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Election not initialized"})
		return
	}

	type Req struct {
		ID       string `json:"id"`
		Name     string `json:"name"`
		Bio      string `json:"bio"`
		PartyID  string `json:"partyId"`
		Age      int    `json:"age"`
		ImageURL string `json:"imageUrl,omitempty"`
	}

	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	log.Printf("Received candidate data: ID=%s, Name=%s, Bio=%s, PartyID=%s, Age=%d, ImageURL=%s",
		req.ID, req.Name, req.Bio, req.PartyID, req.Age, req.ImageURL)

	if req.ID == "" || req.Name == "" {
		log.Println("Missing required fields: ID or Name")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "ID and Name are required"})
		return
	}

	log.Println("Calling election.AddCandidate...")
	err := election.AddCandidate(req.ID, req.Name, req.Bio, req.PartyID, req.Age, req.ImageURL)
	if err != nil {
		log.Printf("Failed to add candidate: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	log.Println("Candidate added successfully, now saving...")

	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	w.WriteHeader(http.StatusCreated)
	response := map[string]string{
		"status":  "success",
		"message": "Candidate added successfully",
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
	log.Println("HandleAddCandidate completed successfully")
}

// Update HandleUpdateCandidate to use partyID
func HandleUpdateCandidate(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleUpdateCandidate called")
	w.Header().Set("Content-Type", "application/json")

	id := mux.Vars(r)["id"]
	type Req struct {
		Name     string `json:"name"`
		Bio      string `json:"bio"`
		PartyID  string `json:"partyId"`
		Age      int    `json:"age"`
		ImageURL string `json:"imageUrl,omitempty"`
	}

	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	log.Printf("Received candidate update data: ID=%s, Name=%s, Bio=%s, PartyID=%s, Age=%d, ImageURL=%s",
		id, req.Name, req.Bio, req.PartyID, req.Age, req.ImageURL)

	err := election.UpdateCandidate(id, req.Name, req.Bio, req.PartyID, req.Age, req.ImageURL)
	if err != nil {
		log.Printf("Failed to update candidate: %v", err)
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	log.Println("Candidate updated successfully, now saving...")
	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	json.NewEncoder(w).Encode(map[string]string{"status": "candidate updated"})
}

// Update HandleDeleteCandidate function
func HandleDeleteCandidate(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleDeleteCandidate called")
	w.Header().Set("Content-Type", "application/json")

	id := mux.Vars(r)["id"]
	err := election.RemoveCandidate(id)
	if err != nil {
		log.Printf("Failed to delete candidate: %v", err)
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Record removal in blockchain
	tx := blockchain.NewTransaction("admin", id, "REMOVE_CANDIDATE")
	chain.AddBlock([]blockchain.Transaction{tx})

	log.Println("Candidate removed successfully, now saving...")
	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	json.NewEncoder(w).Encode(map[string]string{"status": "candidate removed"})
}

// Party Management Handlers
func HandleListParties(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleListParties called")
	w.Header().Set("Content-Type", "application/json")

	if election == nil {
		log.Println("Election is nil!")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Election not initialized"})
		return
	}

	parties := election.ListParties()
	log.Printf("Found %d parties", len(parties))

	// Ensure we return an empty array instead of null
	if parties == nil {
		parties = []contracts.Party{}
	}

	if err := json.NewEncoder(w).Encode(parties); err != nil {
		log.Printf("Failed to encode parties: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode parties"})
		return
	}
	log.Println("HandleListParties completed successfully")
}

func HandleAddParty(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleAddParty called")
	w.Header().Set("Content-Type", "application/json")

	// Check if election is initialized
	if election == nil {
		log.Println("Election is nil in HandleAddParty!")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Election not initialized"})
		return
	}

	type Req struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Color       string `json:"color"`
	}

	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	log.Printf("Received party data: ID=%s, Name=%s, Description=%s, Color=%s",
		req.ID, req.Name, req.Description, req.Color)

	if req.ID == "" || req.Name == "" {
		log.Println("Missing required fields: ID or Name")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "ID and Name are required"})
		return
	}

	log.Println("Calling election.AddParty...")
	err := election.AddParty(req.ID, req.Name, req.Description, req.Color)
	if err != nil {
		log.Printf("Failed to add party: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	log.Println("Party added successfully, now saving...")

	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	w.WriteHeader(http.StatusCreated)
	response := map[string]string{
		"status":  "success",
		"message": "Party added successfully",
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
	log.Println("HandleAddParty completed successfully")
}

func HandleUpdateParty(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleUpdateParty called")
	w.Header().Set("Content-Type", "application/json")

	id := mux.Vars(r)["id"]
	type Req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Color       string `json:"color"`
	}

	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	log.Printf("Received party update data: ID=%s, Name=%s, Description=%s, Color=%s",
		id, req.Name, req.Description, req.Color)

	err := election.UpdateParty(id, req.Name, req.Description, req.Color)
	if err != nil {
		log.Printf("Failed to update party: %v", err)
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	log.Println("Party updated successfully, now saving...")
	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	json.NewEncoder(w).Encode(map[string]string{"status": "party updated"})
}

func HandleDeleteParty(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleDeleteParty called")
	w.Header().Set("Content-Type", "application/json")

	id := mux.Vars(r)["id"]
	err := election.DeleteParty(id)
	if err != nil {
		log.Printf("Failed to delete party: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	log.Println("Party deleted successfully, now saving...")
	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	json.NewEncoder(w).Encode(map[string]string{"status": "party deleted"})
}

// Election Management Handlers
func HandleStartElection(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleStartElection called")
	w.Header().Set("Content-Type", "application/json")

	type Req struct {
		Description   string `json:"description"`
		DurationHours int    `json:"durationHours"`
	}

	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	if req.DurationHours <= 0 {
		req.DurationHours = 24 // Default 24 hours
	}

	duration := time.Duration(req.DurationHours) * time.Hour
	err := election.StartElection(req.Description, duration)
	if err != nil {
		log.Printf("Failed to start election: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	log.Println("Election started successfully, now saving...")
	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	json.NewEncoder(w).Encode(map[string]string{"status": "election started"})
}

func HandleStopElection(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleStopElection called")
	w.Header().Set("Content-Type", "application/json")

	err := election.StopElection()
	if err != nil {
		log.Printf("Failed to stop election: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	log.Println("Election stopped successfully, now saving...")
	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	json.NewEncoder(w).Encode(map[string]string{"status": "election stopped"})
}

func HandleElectionStatus(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleElectionStatus called")
	w.Header().Set("Content-Type", "application/json")

	if election == nil {
		log.Println("Election is nil!")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"isActive": false,
			"status":   "Election not initialized",
		})
		return
	}

	status := map[string]interface{}{
		"isActive": election.IsElectionActive(),
		"status":   election.Status,
	}
	log.Printf("Election status: %v", status)

	if err := json.NewEncoder(w).Encode(status); err != nil {
		log.Printf("Failed to encode status: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode status"})
	}
	log.Println("HandleElectionStatus completed successfully")
}

func HandleElectionResults(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleElectionResults called")
	w.Header().Set("Content-Type", "application/json")

	if election == nil {
		log.Println("Election is nil!")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Election not initialized"})
		return
	}

	candidates := election.ListCandidates()
	results := make([]map[string]interface{}, 0, len(candidates))

	for _, candidate := range candidates {
		results = append(results, map[string]interface{}{
			"candidateId": candidate.CandidateID,
			"name":        candidate.Name,
			"party":       candidate.PartyName,
			"votes":       candidate.Votes,
			"imageUrl":    candidate.ImageURL,
		})
	}

	response := map[string]interface{}{
		"results":        results,
		"electionStatus": election.Status,
		"statistics":     election.GetStatistics(),
	}
	log.Printf("Election results: %v", response)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode results: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode results"})
	}
	log.Println("HandleElectionResults completed successfully")
}

func HandleElectionStatistics(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleElectionStatistics called")
	w.Header().Set("Content-Type", "application/json")

	if election == nil {
		log.Println("Election is nil!")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Election not initialized",
		})
		return
	}

	stats := election.GetStatistics()
	log.Printf("Election statistics: %v", stats)

	if err := json.NewEncoder(w).Encode(stats); err != nil {
		log.Printf("Failed to encode statistics: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode statistics"})
	}
	log.Println("HandleElectionStatistics completed successfully")
}

// User Management Handlers
func HandleAddUser(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleAddUser called")
	w.Header().Set("Content-Type", "application/json")

	type Req struct {
		UserID  string `json:"userId"`
		Name    string `json:"name"`
		Email   string `json:"email"`
		Phone   string `json:"phone"`
		Address string `json:"address"`
	}

	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	if req.UserID == "" || req.Name == "" || req.Email == "" {
		log.Println("Missing required fields: UserID, Name, or Email")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "UserID, Name, and Email are required"})
		return
	}

	log.Printf("Received user data: UserID=%s, Name=%s, Email=%s, Phone=%s, Address=%s",
		req.UserID, req.Name, req.Email, req.Phone, req.Address)

	err := election.AddUser(req.UserID, req.Name, req.Email, req.Phone, req.Address)
	if err != nil {
		log.Printf("Failed to add user: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	log.Println("User added successfully, now saving...")
	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	w.WriteHeader(http.StatusCreated)
	response := map[string]string{"status": "user added", "message": "User registered successfully"}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode response: %v", err)
	}
	log.Println("HandleAddUser completed successfully")
}

func HandleListUsers(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleListUsers called")
	w.Header().Set("Content-Type", "application/json")

	if election == nil {
		log.Println("Election is nil!")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Election not initialized"})
		return
	}

	users := election.ListUsers()
	log.Printf("Found %d users", len(users))

	if users == nil {
		users = []contracts.User{}
	}

	if err := json.NewEncoder(w).Encode(users); err != nil {
		log.Printf("Failed to encode users: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode users"})
		return
	}
	log.Println("HandleListUsers completed successfully")
}

func HandleGetUser(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleGetUser called")
	w.Header().Set("Content-Type", "application/json")

	id := mux.Vars(r)["id"]
	user, err := election.GetUser(id)
	if err != nil {
		log.Printf("Failed to get user: %v", err)
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	if err := json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("Failed to encode user: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode user"})
		return
	}
	log.Println("HandleGetUser completed successfully")
}

func HandleUpdateUser(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleUpdateUser called")
	w.Header().Set("Content-Type", "application/json")

	id := mux.Vars(r)["id"]
	type Req struct {
		Name    string `json:"name"`
		Email   string `json:"email"`
		Phone   string `json:"phone"`
		Address string `json:"address"`
	}

	var req Req
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	log.Printf("Received user update data: ID=%s, Name=%s, Email=%s, Phone=%s, Address=%s",
		id, req.Name, req.Email, req.Phone, req.Address)

	err := election.UpdateUser(id, req.Name, req.Email, req.Phone, req.Address)
	if err != nil {
		log.Printf("Failed to update user: %v", err)
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	log.Println("User updated successfully, now saving...")
	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	json.NewEncoder(w).Encode(map[string]string{"status": "user updated"})
}

func HandleDeleteUser(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleDeleteUser called")
	w.Header().Set("Content-Type", "application/json")

	id := mux.Vars(r)["id"]
	err := election.RemoveUser(id)
	if err != nil {
		log.Printf("Failed to delete user: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	log.Println("User deleted successfully, now saving...")
	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	json.NewEncoder(w).Encode(map[string]string{"status": "user deleted"})
}
