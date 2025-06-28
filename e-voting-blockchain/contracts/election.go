package contracts

import (
	"errors" // For returning custom error messages
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
