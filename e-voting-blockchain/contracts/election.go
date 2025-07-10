package contracts

import (
	"encoding/json"
	"errors"
	"os"
)

// Updated Candidate struct with additional fields
type Candidate struct {
	CandidateID string `json:"candidateId"`
	Name        string `json:"name"`
	Bio         string `json:"bio"`
	Party       string `json:"party"`
	Age         int    `json:"age"`
	ImageURL    string `json:"imageUrl,omitempty"` // Optional image URL
	Votes       int    `json:"votes"`
}

// Election stores all candidates and tracks who has voted.
type Election struct {
	Candidates map[string]Candidate `json:"candidates"`
	Voters     map[string]bool      `json:"voters"`
}

// NewElection creates an empty election
func NewElection() *Election {
	return &Election{
		Candidates: make(map[string]Candidate),
		Voters:     make(map[string]bool),
	}
}

// Vote allows a voter to vote for a candidate (once only).
func (e *Election) Vote(voterID, candidateID string) error {
	if e.Voters[voterID] {
		return errors.New("voter has already voted")
	}
	candidate, ok := e.Candidates[candidateID]
	if !ok {
		return errors.New("invalid candidate")
	}
	candidate.Votes++
	e.Candidates[candidateID] = candidate
	e.Voters[voterID] = true
	return nil
}

// Tally returns vote counts for all candidates.
func (e *Election) Tally() map[string]int {
	result := make(map[string]int)
	for id, c := range e.Candidates {
		result[id] = c.Votes
	}
	return result
}

// SaveElection writes the election struct to a file.
func (e *Election) SaveElection() error {
	data, err := json.MarshalIndent(e, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile("election.json", data, 0644)
}

// LoadElection reads the election struct from file.
func LoadElection() (*Election, error) {
	data, err := os.ReadFile("election.json")
	if err != nil {
		return nil, err
	}
	var e Election
	if err := json.Unmarshal(data, &e); err != nil {
		return nil, err
	}
	return &e, nil
}

// AddCandidate adds a new candidate with all fields
func (e *Election) AddCandidate(id, name, bio, party string, age int, imageURL string) error {
	if _, exists := e.Candidates[id]; exists {
		return errors.New("candidate with that ID already exists")
	}
	e.Candidates[id] = Candidate{
		CandidateID: id,
		Name:        name,
		Bio:         bio,
		Party:       party,
		Age:         age,
		ImageURL:    imageURL,
		Votes:       0,
	}
	return nil
}

// RemoveCandidate deletes a candidate from the election.
func (e *Election) RemoveCandidate(id string) error {
	if _, exists := e.Candidates[id]; !exists {
		return errors.New("candidate not found")
	}
	delete(e.Candidates, id)
	return nil
}

// UpdateCandidate changes candidate information
func (e *Election) UpdateCandidate(id, name, bio, party string, age int, imageURL string) error {
	_, exists := e.Candidates[id]
	if !exists {
		return errors.New("candidate not found")
	}

	// Update the candidate with new information
	e.Candidates[id] = Candidate{
		CandidateID: id,
		Name:        name,
		Bio:         bio,
		Party:       party,
		Age:         age,
		ImageURL:    imageURL,
		Votes:       e.Candidates[id].Votes, // Preserve existing votes
	}
	return nil
}

// GetCandidate returns a candidate by ID.
func (e *Election) GetCandidate(id string) (Candidate, error) {
	c, exists := e.Candidates[id]
	if !exists {
		return Candidate{}, errors.New("candidate not found")
	}
	return c, nil
}

// ListCandidates returns a list of all candidates.
func (e *Election) ListCandidates() []Candidate {
	list := make([]Candidate, 0, len(e.Candidates))
	for _, c := range e.Candidates {
		list = append(list, c)
	}
	return list
}
