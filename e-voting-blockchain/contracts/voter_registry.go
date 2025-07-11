package contracts

import (
	"crypto/rand"
	"encoding/json"
	"math/big"
	"os"
)

type VoterRecord struct {
	VoterID  string `json:"VoterID"`
	Name     string `json:"name"`
	DOB      string `json:"dob"`
	Location string `json:"location"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Struct for users who have successfully registered
type RegisteredUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
	VoterID  string `json:"voterId"`
	Email    string `json:"email"`
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

func (db *VoterDatabase) ValidateCredentials(voterID, email, password string) bool {
	voter, exists := db.Records[voterID]
	if !exists {
		return false
	}
	return voter.Email == email && voter.Password == password
}

// Save saves the VoterDatabase to voters.json
func (db *VoterDatabase) Save() error {
	records := make([]VoterRecord, 0, len(db.Records))
	for _, r := range db.Records {
		records = append(records, r)
	}
	data, err := json.MarshalIndent(records, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile("voters.json", data, 0644)
}

// GenerateSecurePassword returns a random alphanumeric password
func GenerateSecurePassword(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	password := make([]byte, length)

	for i := range password {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		password[i] = charset[num.Int64()]
	}

	return string(password), nil
}

func LoadRegisteredUsers() ([]RegisteredUser, error) {
	data, err := os.ReadFile("registered_voters.json")
	if err != nil {
		return nil, err
	}
	var users []RegisteredUser
	if err := json.Unmarshal(data, &users); err != nil {
		return nil, err
	}
	return users, nil
}

func SaveRegisteredUsers(users []RegisteredUser) error {
	data, err := json.MarshalIndent(users, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile("registered_voters.json", data, 0644)
}
