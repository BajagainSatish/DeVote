package contracts

import (
	"encoding/json"
	"os"
)

// VoterRecord represents a voter in the government database
type VoterRecord struct {
	VoterID  string `json:"VoterID"`
	Name     string `json:"Name"`
	DOB      string `json:"DOB"`
	Location string `json:"Location"`
	Email    string `json:"Email"`
}

// VoterDatabase represents the government voter database
type VoterDatabase struct {
	Records map[string]VoterRecord `json:"records"`
}

// IsValid checks if the provided voter details match the database
func (db *VoterDatabase) IsValid(voterID, name, dob string) bool {
	record, exists := db.Records[voterID]
	if !exists {
		return false
	}

	return record.Name == name && record.DOB == dob
}

// LoadVoterDatabase loads the voter database from file
func LoadVoterDatabase() (*VoterDatabase, error) {
	data, err := os.ReadFile("voters.json")
	if err != nil {
		return nil, err
	}

	var db VoterDatabase
	if err := json.Unmarshal(data, &db); err != nil {
		return nil, err
	}

	return &db, nil
}

// SaveVoterDatabase saves the voter database to file
func SaveVoterDatabase(db *VoterDatabase) error {
	data, err := json.MarshalIndent(db, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile("voters.json", data, 0644)
}
