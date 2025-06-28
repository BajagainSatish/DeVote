package contracts

import (
	"encoding/json"
	"errors" //Return custom error messages
	"os"
)

// Election represents one election round with registered candidates and voters.
type Election struct {
	Candidates map[string]int  // Candidate name → number of votes
	Voters     map[string]bool // VoterID → hasVoted flag
}

// NewElection creates a new election instance with a list of candidate names.
func NewElection(candidates []string) *Election {
	// Initialize candidate map with 0 votes
	cMap := make(map[string]int)
	for _, c := range candidates {
		cMap[c] = 0
	}

	return &Election{
		Candidates: cMap,
		Voters:     make(map[string]bool), // Empty map to track voters
	}
}

// Vote lets a voter vote for a candidate.
// It validates that the voter hasn't voted before and candidate is valid.
func (e *Election) Vote(voterID, candidateID string) error {
	if e.Voters[voterID] {
		return errors.New("voter has already voted")
	}

	if _, ok := e.Candidates[candidateID]; !ok {
		return errors.New("invalid candidate")
	}

	e.Candidates[candidateID] += 1 // Increment vote count
	e.Voters[voterID] = true       // Mark this voter as having voted

	return nil
}

// Tally returns the current vote count for all candidates.
func (e *Election) Tally() map[string]int {
	return e.Candidates
}

const electionFile = "election.json" // Stored election state

// SaveElection writes the election state to disk
func (e *Election) SaveElection() error {
	data, err := json.MarshalIndent(e, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(electionFile, data, 0644)
}

// LoadElection reads the election state from disk
func LoadElection() (*Election, error) {
	data, err := os.ReadFile(electionFile)
	if err != nil {
		return nil, err
	}

	var e Election
	if err := json.Unmarshal(data, &e); err != nil {
		return nil, err
	}
	return &e, nil
}
