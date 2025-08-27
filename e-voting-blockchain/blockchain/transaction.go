//transaction.go

package blockchain

import (
	"crypto/sha256" // Used to hash transaction data
	"encoding/hex"  // Used to format hash as string
)

// Transaction represents one vote in the system.
// A transaction is created when a voter casts a vote to a candidate.

type Transaction struct {
	ID       string `json:"ID"`                 // Added JSON tag for proper serialization, Unique identifier (hash) of the transaction
	Sender   string `json:"Sender,omitempty"`   // Added JSON tag for proper serialization, The voter's ID (usually hashed)
	Receiver string `json:"Receiver,omitempty"` // Added JSON tag for proper serialization, The candidate's ID
	Payload  string `json:"Payload"`            // Added JSON tag for proper serialization, Optional data (in our case, "VOTE")
	Type     string `json:"Type,omitempty"`
}

// NewTransaction creates and returns a new transaction.
// It generates a unique ID by hashing the input data.
func NewTransaction(sender, receiver, payload string) Transaction {
	// Combine all fields into one string
	data := sender + receiver + payload

	// Hash the data using SHA-256
	hash := sha256.Sum256([]byte(data))

	// Return a new transaction with the hashed ID
	return Transaction{
		ID:       hex.EncodeToString(hash[:]),
		Sender:   sender,
		Receiver: receiver,
		Payload:  payload,
	}
}
