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

// IsValidTransaction validates a transaction
func (tx *Transaction) IsValidTransaction() bool {
	// Basic validation
	if tx.ID == "" || tx.Sender == "" || tx.Receiver == "" {
		return false
	}

	// Verify hash by recomputing and comparing with stored ID
	expectedHash := tx.ComputeHash()
	return tx.ID == expectedHash
}

// ComputeHash generates a SHA-256 hash of the transaction fields
func (tx *Transaction) ComputeHash() string {
	// Concatenate relevant fields
	data := tx.Sender + tx.Receiver + tx.Payload + tx.Type

	// Compute SHA-256
	hash := sha256.Sum256([]byte(data))

	// Return hex-encoded string
	return hex.EncodeToString(hash[:])
}

// GetTransactionsByCandidate returns all transactions for a specific candidate
func (bc *Blockchain) GetTransactionsByCandidate(candidate string) []Transaction {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()

	var transactions []Transaction
	for _, block := range bc.Blocks {
		for _, tx := range block.Transactions {
			if tx.Receiver == candidate && tx.Payload == "VOTE" {
				transactions = append(transactions, tx)
			}
		}
	}
	return transactions
}

// GetVoteTally returns vote counts for all candidates
func (bc *Blockchain) GetVoteTally() map[string]int {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()

	tally := make(map[string]int)
	for _, block := range bc.Blocks {
		for _, tx := range block.Transactions {
			if tx.Payload == "VOTE" {
				tally[tx.Receiver]++
			}
		}
	}
	return tally
}
