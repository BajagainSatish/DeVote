package contracts

import (
	"encoding/json"
	"errors"
	"os"
	"time"
)

// Party represents a political party
type Party struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Color       string `json:"color"` // Hex color for UI
}

// Candidate with updated structure
type Candidate struct {
	CandidateID string `json:"candidateId"`
	Name        string `json:"name"`
	Bio         string `json:"bio"`
	PartyID     string `json:"partyId"`   // Reference to party ID
	PartyName   string `json:"partyName"` // Denormalized for easy access
	Age         int    `json:"age"`
	ImageURL    string `json:"imageUrl,omitempty"`
	Votes       int    `json:"votes"`
}

// User represents a registered voter
type User struct {
	UserID   string    `json:"userId"`
	Name     string    `json:"name"`
	Email    string    `json:"email"`
	Phone    string    `json:"phone,omitempty"`
	Address  string    `json:"address,omitempty"`
	HasVoted bool      `json:"hasVoted"`
	VotedAt  time.Time `json:"votedAt,omitempty"`
}

// ElectionStatus represents the current state of the election
type ElectionStatus struct {
	IsActive    bool      `json:"isActive"`
	StartTime   time.Time `json:"startTime"`
	EndTime     time.Time `json:"endTime"`
	Description string    `json:"description"`
}

// Election with enhanced structure
type Election struct {
	Candidates map[string]Candidate `json:"candidates"`
	Voters     map[string]bool      `json:"voters"`
	Users      map[string]User      `json:"users"`
	Parties    map[string]Party     `json:"parties"`
	Status     ElectionStatus       `json:"status"`
}

// NewElection creates an empty election
func NewElection() *Election {
	return &Election{
		Candidates: make(map[string]Candidate),
		Voters:     make(map[string]bool),
		Users:      make(map[string]User),
		Parties:    make(map[string]Party),
		Status: ElectionStatus{
			IsActive:    false,
			Description: "Election not started",
		},
	}
}

// initializeMaps ensures all maps are properly initialized
func (e *Election) initializeMaps() {
	if e.Candidates == nil {
		e.Candidates = make(map[string]Candidate)
	}
	if e.Voters == nil {
		e.Voters = make(map[string]bool)
	}
	if e.Users == nil {
		e.Users = make(map[string]User)
	}
	if e.Parties == nil {
		e.Parties = make(map[string]Party)
	}
}

// Party Management Methods
func (e *Election) AddParty(id, name, description, color string) error {
	// Ensure maps are initialized
	e.initializeMaps()

	if _, exists := e.Parties[id]; exists {
		return errors.New("party with that ID already exists")
	}
	e.Parties[id] = Party{
		ID:          id,
		Name:        name,
		Description: description,
		Color:       color,
	}
	return nil
}

func (e *Election) UpdateParty(id, name, description, color string) error {
	e.initializeMaps()

	if _, exists := e.Parties[id]; !exists {
		return errors.New("party not found")
	}
	e.Parties[id] = Party{
		ID:          id,
		Name:        name,
		Description: description,
		Color:       color,
	}
	return nil
}

func (e *Election) DeleteParty(id string) error {
	e.initializeMaps()

	if _, exists := e.Parties[id]; !exists {
		return errors.New("party not found")
	}
	// Check if any candidates belong to this party
	for _, candidate := range e.Candidates {
		if candidate.PartyID == id {
			return errors.New("cannot delete party: candidates are associated with it")
		}
	}
	delete(e.Parties, id)
	return nil
}

func (e *Election) ListParties() []Party {
	e.initializeMaps()

	parties := make([]Party, 0, len(e.Parties))
	for _, party := range e.Parties {
		parties = append(parties, party)
	}
	return parties
}

// Election Management Methods
func (e *Election) StartElection(description string, duration time.Duration) error {
	if e.Status.IsActive {
		return errors.New("election is already active")
	}
	now := time.Now()
	e.Status = ElectionStatus{
		IsActive:    true,
		StartTime:   now,
		EndTime:     now.Add(duration),
		Description: description,
	}
	return nil
}

func (e *Election) StopElection() error {
	if !e.Status.IsActive {
		return errors.New("election is not active")
	}
	e.Status.IsActive = false
	e.Status.Description = "Election ended"
	return nil
}

func (e *Election) IsElectionActive() bool {
	if !e.Status.IsActive {
		return false
	}
	// Check if election time has expired
	if time.Now().After(e.Status.EndTime) {
		e.Status.IsActive = false
		e.Status.Description = "Election time expired"
		return false
	}
	return true
}

// Enhanced Candidate Methods
func (e *Election) AddCandidate(id, name, bio, partyID string, age int, imageURL string) error {
	e.initializeMaps()

	if _, exists := e.Candidates[id]; exists {
		return errors.New("candidate with that ID already exists")
	}
	// Get party name
	partyName := "Independent"
	if partyID != "" {
		if party, exists := e.Parties[partyID]; exists {
			partyName = party.Name
		} else {
			return errors.New("invalid party ID")
		}
	}
	e.Candidates[id] = Candidate{
		CandidateID: id,
		Name:        name,
		Bio:         bio,
		PartyID:     partyID,
		PartyName:   partyName,
		Age:         age,
		ImageURL:    imageURL,
		Votes:       0,
	}
	return nil
}

func (e *Election) UpdateCandidate(id, name, bio, partyID string, age int, imageURL string) error {
	e.initializeMaps()

	candidate, exists := e.Candidates[id]
	if !exists {
		return errors.New("candidate not found")
	}
	// Get party name
	partyName := "Independent"
	if partyID != "" {
		if party, exists := e.Parties[partyID]; exists {
			partyName = party.Name
		} else {
			return errors.New("invalid party ID")
		}
	}
	candidate.Name = name
	candidate.Bio = bio
	candidate.PartyID = partyID
	candidate.PartyName = partyName
	candidate.Age = age
	candidate.ImageURL = imageURL
	e.Candidates[id] = candidate
	return nil
}

// Updated Statistics Methods to include registered users count
func (e *Election) GetStatistics() map[string]interface{} {
	e.initializeMaps()

	totalVotes := 0
	votedUsers := 0
	for _, candidate := range e.Candidates {
		totalVotes += candidate.Votes
	}
	for _, user := range e.Users {
		if user.HasVoted {
			votedUsers++
		}
	}

	// Get count of registered users from the file
	registeredUsersCount := 0
	if registeredUsers, err := LoadRegisteredUsers(); err == nil {
		registeredUsersCount = len(registeredUsers)
	}

	return map[string]interface{}{
		"totalCandidates": len(e.Candidates),
		"totalParties":    len(e.Parties),
		"totalUsers":      len(e.Users),
		"totalVoters":     len(e.Voters),
		"totalVotes":      totalVotes,
		"votedUsers":      votedUsers,
		"pendingVoters":   len(e.Users) - votedUsers,
		"registeredUsers": registeredUsersCount, // Count from registered_voters.json
		"electionStatus":  e.Status,
	}
}

// Vote method with election status check
func (e *Election) Vote(voterID, candidateID string) error {
	e.initializeMaps()

	if !e.IsElectionActive() {
		return errors.New("election is not active")
	}
	if e.Voters[voterID] {
		return errors.New("voter has already voted")
	}
	candidate, ok := e.Candidates[candidateID]
	if !ok {
		return errors.New("invalid candidate")
	}
	// Update user voting status
	if user, exists := e.Users[voterID]; exists {
		user.HasVoted = true
		user.VotedAt = time.Now()
		e.Users[voterID] = user
	}
	candidate.Votes++
	e.Candidates[candidateID] = candidate
	e.Voters[voterID] = true
	return nil
}

// Existing methods remain the same...
func (e *Election) Tally() map[string]int {
	e.initializeMaps()

	result := make(map[string]int)
	for id, c := range e.Candidates {
		result[id] = c.Votes
	}
	return result
}

func (e *Election) SaveElection() error {
	data, err := json.MarshalIndent(e, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile("election.json", data, 0644)
}

func LoadElection() (*Election, error) {
	data, err := os.ReadFile("election.json")
	if err != nil {
		return nil, err
	}
	var e Election
	if err := json.Unmarshal(data, &e); err != nil {
		return nil, err
	}

	// Ensure all maps are properly initialized after loading
	e.initializeMaps()

	return &e, nil
}

func (e *Election) RemoveCandidate(id string) error {
	e.initializeMaps()

	if _, exists := e.Candidates[id]; !exists {
		return errors.New("candidate not found")
	}
	delete(e.Candidates, id)
	return nil
}

func (e *Election) GetCandidate(id string) (Candidate, error) {
	e.initializeMaps()

	c, exists := e.Candidates[id]
	if !exists {
		return Candidate{}, errors.New("candidate not found")
	}
	return c, nil
}

func (e *Election) ListCandidates() []Candidate {
	e.initializeMaps()

	list := make([]Candidate, 0, len(e.Candidates))
	for _, c := range e.Candidates {
		list = append(list, c)
	}
	return list
}

// User Management Methods
func (e *Election) AddUser(userID, name, email, phone, address string) error {
	e.initializeMaps()

	if _, exists := e.Users[userID]; exists {
		return errors.New("user with that ID already exists")
	}
	// Check if email already exists
	for _, user := range e.Users {
		if user.Email == email {
			return errors.New("user with that email already exists")
		}
	}
	e.Users[userID] = User{
		UserID:   userID,
		Name:     name,
		Email:    email,
		Phone:    phone,
		Address:  address,
		HasVoted: false,
	}
	return nil
}

func (e *Election) RemoveUser(userID string) error {
	e.initializeMaps()

	user, exists := e.Users[userID]
	if !exists {
		return errors.New("user not found")
	}
	if user.HasVoted {
		return errors.New("cannot remove user who has already voted")
	}
	delete(e.Users, userID)
	delete(e.Voters, userID) // Also remove from voters map if exists
	return nil
}

func (e *Election) GetUser(userID string) (User, error) {
	e.initializeMaps()

	user, exists := e.Users[userID]
	if !exists {
		return User{}, errors.New("user not found")
	}
	return user, nil
}

func (e *Election) ListUsers() []User {
	e.initializeMaps()

	users := make([]User, 0, len(e.Users))
	for _, user := range e.Users {
		users = append(users, user)
	}
	return users
}

func (e *Election) UpdateUser(userID, name, email, phone, address string) error {
	e.initializeMaps()

	user, exists := e.Users[userID]
	if !exists {
		return errors.New("user not found")
	}
	// Check if email already exists for another user
	for id, existingUser := range e.Users {
		if id != userID && existingUser.Email == email {
			return errors.New("user with that email already exists")
		}
	}
	user.Name = name
	user.Email = email
	user.Phone = phone
	user.Address = address
	e.Users[userID] = user
	return nil
}
