package contracts

import (
	"encoding/json"
	"os"
)

type VoterRecord struct {
	VoterID  string // NID or Voter Card Information
	Name     string
	DOB      string
	Location string
}

// VoterDatabase holds all valid voter records
type VoterDatabase struct {
	Records map[string]VoterRecord // Keyed by Voter ID
}

// LoadVoterDatabase loads voter data from a file
func LoadVoterDatabase() (*VoterDatabase, error) {
	data, err := os.ReadFile("voters.json")
	if err != nil {
		return nil, err
	}

	var list []VoterRecord
	if err := json.Unmarshal(data, &list); err != nil {
		return nil, err
	}

	db := &VoterDatabase{Records: make(map[string]VoterRecord)}
	for _, record := range list {
		db.Records[record.VoterID] = record
	}
	return db, nil
}

// IsValid checks whether a voter's info matches a valid entry
func (db *VoterDatabase) IsValid(id, name, dob string) bool {
	voter, exists := db.Records[id]
	if !exists {
		return false
	}
	return voter.Name == name && voter.DOB == dob
}
