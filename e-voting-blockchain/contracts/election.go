package contracts

import (
	"encoding/json"
	"errors" //Return custom error messages
	"os"
)

// Candidate: A person running in the election
type Candidate struct {
	ID    string // unique identifier
	Name  string // display name
	Bio   string // optional description or manifesto
	Votes int    // number of votes received by candidate
}

// Election stores all candidates and tracks who has voted.
type Election struct {
	Candidates map[string]Candidate // candidateID → Candidate
	Voters     map[string]bool      // voterID → hasVoted
}

// NewElection creates an empty election (no candidates yet)
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

// Tally returns just the vote counts for all candidates.
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

// AddCandidate adds a new candidate if the ID is unique.
func (e *Election) AddCandidate(id, name, bio string) error {
	if _, exists := e.Candidates[id]; exists {
		return errors.New("candidate with that ID already exists")
	}
	e.Candidates[id] = Candidate{ID: id, Name: name, Bio: bio, Votes: 0}
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

// UpdateCandidate changes a candidate's name/bio (not votes).
func (e *Election) UpdateCandidate(id, name, bio string) error {
	c, exists := e.Candidates[id]
	if !exists {
		return errors.New("candidate not found")
	}
	c.Name = name
	c.Bio = bio
	e.Candidates[id] = c
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
