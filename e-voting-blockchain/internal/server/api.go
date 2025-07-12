package server

import (
	"e-voting-blockchain/blockchain"
	"e-voting-blockchain/contracts"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

// Global election and blockchain variables
var election *contracts.Election
var chain *blockchain.Blockchain
var blockchainLogger *BlockchainLogger

func init() {
	log.Println("Initializing election and blockchain...")

	// Initialize blockchain
	chain = blockchain.NewBlockchain()
	blockchainLogger = NewBlockchainLogger(chain)

	// Start WebSocket hub for real-time notifications
	StartWebSocketHub()

	// Load election
	loaded, err := contracts.LoadElection()
	if err != nil {
		log.Printf("Failed to load election, creating new one: %v", err)
		election = contracts.NewElection()
		if saveErr := election.SaveElection(); saveErr != nil {
			log.Printf("Failed to save new election: %v", saveErr)
		}
	} else {
		election = loaded
		log.Println("Election loaded successfully")
	}
}

// Updated function to get voter details from the correct registered users file
func getVoterDetailsFromRegistered(voterID string) (string, string, error) {
	log.Printf("Looking for voter details for voterID: %s", voterID)
	// Load registered users from the correct path
	registeredUsers, err := contracts.LoadRegisteredUsers()
	if err != nil {
		log.Printf("Failed to load registered users: %v", err)
		return "", "", err
	}

	log.Printf("Loaded %d registered users", len(registeredUsers))
	// Find the user by voterID
	for _, user := range registeredUsers {
		log.Printf("Checking user: VoterID=%s, Username=%s", user.VoterID, user.Username)
		if user.VoterID == voterID {
			log.Printf("Found registered user for voterID %s", voterID)
			// Load the voter database to get name and DOB
			db, err := contracts.LoadVoterDatabase()
			if err != nil {
				log.Printf("Failed to load voter database: %v", err)
				return "", "", err
			}

			if voter, exists := db.Records[voterID]; exists {
				log.Printf("Found voter details: Name=%s, DOB=%s", voter.Name, voter.DOB)
				return voter.Name, voter.DOB, nil
			}
			return "", "", errors.New("voter details not found in government database")
		}
	}

	log.Printf("Voter with ID %s not found in registered users", voterID)
	return "", "", errors.New("voter not registered")
}

// HandleVote receives a POST request to cast a vote with blockchain logging
func HandleVote(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleVote called")
	w.Header().Set("Content-Type", "application/json")

	type VoteRequest struct {
		VoterID     string `json:"voterID"`
		Name        string `json:"name"`
		DOB         string `json:"dob"`
		CandidateID string `json:"candidateID"`
	}

	var req VoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Failed to decode request body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	log.Printf("Received vote request: VoterID=%s, CandidateID=%s, Name=%s, DOB=%s",
		req.VoterID, req.CandidateID, req.Name, req.DOB)

	// Check if election is active
	if !election.IsElectionActive() {
		log.Println("Election is not active")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Election is not active"})
		return
	}

	// If name and DOB are empty, try to get them from registered users
	if req.Name == "" || req.DOB == "" {
		log.Println("Name or DOB empty, fetching from registered users...")
		name, dob, err := getVoterDetailsFromRegistered(req.VoterID)
		if err != nil {
			log.Printf("Failed to get voter details: %v", err)
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		req.Name = name
		req.DOB = dob
		log.Printf("Retrieved voter details: Name=%s, DOB=%s", req.Name, req.DOB)
	}

	// Load valid voter database for government validation
	db, err := contracts.LoadVoterDatabase()
	if err != nil {
		log.Printf("Failed to load voter registry: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to load voter registry"})
		return
	}

	// Validate voter against government database
	log.Printf("Validating voter: ID=%s, Name=%s, DOB=%s", req.VoterID, req.Name, req.DOB)
	if !db.IsValid(req.VoterID, req.Name, req.DOB) {
		log.Printf("Invalid voter details for: ID=%s, Name=%s, DOB=%s", req.VoterID, req.Name, req.DOB)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid voter details in government database"})
		return
	}
	log.Println("Voter validation successful")

	// Validate that the candidate exists
	_, err = election.GetCandidate(req.CandidateID)
	if err != nil {
		log.Printf("Invalid candidate ID: %s", req.CandidateID)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid candidate selected"})
		return
	}

	// Check if already voted and cast vote
	log.Printf("Checking if voter %s has already voted", req.VoterID)
	err = election.Vote(req.VoterID, req.CandidateID)
	if err != nil {
		log.Printf("Failed to vote: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	log.Println("Vote recorded successfully")

	// // Create a transaction and add it to the blockchain
	// tx := blockchain.NewTransaction(req.VoterID, req.CandidateID, "VOTE")
	// chain.AddBlock([]blockchain.Transaction{tx})

	// Log to blockchain
	blockchainLogger.LogVote(req.VoterID, req.CandidateID, r)

	// Save updated election state
	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusCreated)
	response := map[string]string{"status": "vote accepted", "message": "Your vote has been recorded successfully"}
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

// HandleAddCandidate with blockchain logging
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

	if req.ID == "" || req.Name == "" {
		log.Println("Missing required fields: ID or Name")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "ID and Name are required"})
		return
	}

	err := election.AddCandidate(req.ID, req.Name, req.Bio, req.PartyID, req.Age, req.ImageURL)
	if err != nil {
		log.Printf("Failed to add candidate: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Log to blockchain
	details := map[string]interface{}{
		"name":     req.Name,
		"bio":      req.Bio,
		"partyID":  req.PartyID,
		"age":      req.Age,
		"imageURL": req.ImageURL,
	}
	blockchainLogger.LogCandidateAction("add", "admin", req.ID, req.Name, details, r)

	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Candidate added successfully",
	})

}

// HandleUpdateCandidate with blockchain logging
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
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	err := election.UpdateCandidate(id, req.Name, req.Bio, req.PartyID, req.Age, req.ImageURL)
	if err != nil {
		log.Printf("Failed to update candidate: %v", err)
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Log to blockchain
	details := map[string]interface{}{
		"name":     req.Name,
		"bio":      req.Bio,
		"partyID":  req.PartyID,
		"age":      req.Age,
		"imageURL": req.ImageURL,
	}
	blockchainLogger.LogCandidateAction("update", "admin", id, req.Name, details, r)

	if saveErr := election.SaveElection(); saveErr != nil {
		log.Printf("Failed to save election: %v", saveErr)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}
	log.Println("Election saved successfully")

	json.NewEncoder(w).Encode(map[string]string{"status": "candidate updated"})
}

// HandleDeleteCandidate with blockchain logging
func HandleDeleteCandidate(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleDeleteCandidate called")
	w.Header().Set("Content-Type", "application/json")

	id := mux.Vars(r)["id"]

	// Get candidate info before deletion
	candidate, err := election.GetCandidate(id)
	if err != nil {
		log.Printf("Failed to delete candidate: %v", err)
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	err = election.RemoveCandidate(id)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Log to blockchain
	details := map[string]interface{}{
		"name":    candidate.Name,
		"partyID": candidate.PartyID,
	}
	blockchainLogger.LogCandidateAction("delete", "admin", id, candidate.Name, details, r)

	if saveErr := election.SaveElection(); saveErr != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}

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

// HandleAddParty with blockchain logging
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
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	if req.ID == "" || req.Name == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "ID and Name are required"})
		return
	}

	err := election.AddParty(req.ID, req.Name, req.Description, req.Color)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Log to blockchain
	details := map[string]interface{}{
		"name":        req.Name,
		"description": req.Description,
		"color":       req.Color,
	}
	blockchainLogger.LogPartyAction("add", "admin", req.ID, req.Name, details, r)

	if saveErr := election.SaveElection(); saveErr != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Party added successfully",
	})
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
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	err := election.UpdateParty(id, req.Name, req.Description, req.Color)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Log to blockchain
	details := map[string]interface{}{
		"name":        req.Name,
		"description": req.Description,
		"color":       req.Color,
	}
	blockchainLogger.LogPartyAction("update", "admin", id, req.Name, details, r)

	if saveErr := election.SaveElection(); saveErr != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "party updated"})
}

func HandleDeleteParty(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleDeleteParty called")
	w.Header().Set("Content-Type", "application/json")

	id := mux.Vars(r)["id"]

	// Get party info before deletion
	parties := election.ListParties()
	var partyName string
	for _, party := range parties {
		if party.ID == id {
			partyName = party.Name
			break
		}
	}

	err := election.DeleteParty(id)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Log to blockchain
	details := map[string]interface{}{
		"name": partyName,
	}
	blockchainLogger.LogPartyAction("delete", "admin", id, partyName, details, r)

	if saveErr := election.SaveElection(); saveErr != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}

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
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid JSON format"})
		return
	}

	if req.DurationHours <= 0 {
		req.DurationHours = 24
	}

	duration := time.Duration(req.DurationHours) * time.Hour
	err := election.StartElection(req.Description, duration)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Log to blockchain
	details := map[string]interface{}{
		"description":   req.Description,
		"durationHours": req.DurationHours,
		"endTime":       time.Now().Add(duration),
	}
	blockchainLogger.LogElectionAction("start", "admin", req.Description, details, r)

	if saveErr := election.SaveElection(); saveErr != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "election started"})
}

// HandleStopElection with blockchain logging
func HandleStopElection(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleStopElection called")
	w.Header().Set("Content-Type", "application/json")

	err := election.StopElection()
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Log to blockchain
	details := map[string]interface{}{
		"stoppedAt": time.Now(),
	}
	blockchainLogger.LogElectionAction("stop", "admin", "Election manually stopped", details, r)

	if saveErr := election.SaveElection(); saveErr != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save election data"})
		return
	}

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

// New handler for getting registered voters from the JSON file
func HandleGetRegisteredVoters(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleGetRegisteredVoters called")
	w.Header().Set("Content-Type", "application/json")

	registeredUsers, err := contracts.LoadRegisteredUsers()
	if err != nil {
		log.Printf("Failed to load registered users: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to load registered users"})
		return
	}

	// Convert to a format that includes voter details from the voter database
	votersWithDetails := make([]map[string]interface{}, 0, len(registeredUsers))

	// Load voter database to get additional details
	db, err := contracts.LoadVoterDatabase()
	if err != nil {
		log.Printf("Failed to load voter database: %v", err)
		// Still return registered users without additional details
		for _, user := range registeredUsers {
			votersWithDetails = append(votersWithDetails, map[string]interface{}{
				"voterID":  user.VoterID,
				"username": user.Username,
				"email":    user.Email,
				"name":     "N/A",
				"dob":      "N/A",
				"location": "N/A",
			})
		}
	} else {
		// Include details from voter database
		for _, user := range registeredUsers {
			voterDetail := map[string]interface{}{
				"voterID":  user.VoterID,
				"username": user.Username,
				"email":    user.Email,
				"name":     "N/A",
				"dob":      "N/A",
				"location": "N/A",
			}

			if voter, exists := db.Records[user.VoterID]; exists {
				voterDetail["name"] = voter.Name
				voterDetail["dob"] = voter.DOB
				voterDetail["location"] = voter.Location
			}

			votersWithDetails = append(votersWithDetails, voterDetail)
		}
	}

	log.Printf("Found %d registered voters", len(votersWithDetails))

	if err := json.NewEncoder(w).Encode(votersWithDetails); err != nil {
		log.Printf("Failed to encode registered voters: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode registered voters"})
		return
	}
	log.Println("HandleGetRegisteredVoters completed successfully")
}

// HandleDeleteRegisteredVoter with blockchain logging
func HandleDeleteRegisteredVoter(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleDeleteRegisteredVoter called")
	w.Header().Set("Content-Type", "application/json")

	voterID := mux.Vars(r)["voterID"]
	// Load current registered users
	registeredUsers, err := contracts.LoadRegisteredUsers()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to load registered users"})
		return
	}

	// Find voter info before deletion
	var voterEmail string
	found := false
	updatedUsers := make([]contracts.RegisteredUser, 0, len(registeredUsers))

	for _, user := range registeredUsers {
		if user.VoterID != voterID {
			updatedUsers = append(updatedUsers, user)
		} else {
			found = true
			voterEmail = user.Email
		}
	}

	if !found {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Voter not found"})
		return
	}

	// Save updated list
	if err := contracts.SaveRegisteredUsers(updatedUsers); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save updated registered users"})
		return
	}

	// Log to blockchain
	details := map[string]interface{}{
		"email": voterEmail,
	}
	blockchainLogger.LogUserAction("delete_voter", "admin", voterID, details, r)

	json.NewEncoder(w).Encode(map[string]string{
		"status":  "voter deleted",
		"message": "Registered voter deleted successfully",
	})
}
