package blockchain

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"time"
)

// Block represents a single block in the blockchain
type Block struct {
	Index        int           `json:"index"`
	Timestamp    string        `json:"timestamp"`
	PrevHash     string        `json:"prevHash"`
	Hash         string        `json:"hash"`
	Transactions []Transaction `json:"transactions"`
	CreatedAt    time.Time     `json:"createdAt"`
}

// NewBlock creates a new block with proper timestamp
func NewBlock(index int, prevHash string, transactions []Transaction) Block {
	now := time.Now()
	block := Block{
		Index:        index,
		Timestamp:    now.Format(time.RFC3339),
		PrevHash:     prevHash,
		Transactions: transactions,
		CreatedAt:    now,
	}
	block.GenerateHash()
	return block
}

// GenerateHash calculates and sets the hash for this block
func (b *Block) GenerateHash() {
	// Create a copy of the block without the hash field for calculation
	blockData := struct {
		Index        int           `json:"index"`
		Timestamp    string        `json:"timestamp"`
		PrevHash     string        `json:"prevHash"`
		Transactions []Transaction `json:"transactions"`
	}{
		Index:        b.Index,
		Timestamp:    b.Timestamp,
		PrevHash:     b.PrevHash,
		Transactions: b.Transactions,
	}

	blockBytes, _ := json.Marshal(blockData)
	hash := sha256.Sum256(blockBytes)
	b.Hash = fmt.Sprintf("%x", hash)
}

// CalculateHash returns the hash without modifying the block
func (b Block) CalculateHash() string {
	// Create a copy of the block without the hash field for calculation
	blockData := struct {
		Index        int           `json:"index"`
		Timestamp    string        `json:"timestamp"`
		PrevHash     string        `json:"prevHash"`
		Transactions []Transaction `json:"transactions"`
	}{
		Index:        b.Index,
		Timestamp:    b.Timestamp,
		PrevHash:     b.PrevHash,
		Transactions: b.Transactions,
	}

	blockBytes, _ := json.Marshal(blockData)
	hash := sha256.Sum256(blockBytes)
	return fmt.Sprintf("%x", hash)
}

// GetTimestamp returns the parsed timestamp
func (b Block) GetTimestamp() time.Time {
	if b.CreatedAt.IsZero() {
		// Fallback to parsing the timestamp string
		if t, err := time.Parse(time.RFC3339, b.Timestamp); err == nil {
			return t
		}
		// If parsing fails, return current time
		return time.Now()
	}
	return b.CreatedAt
}

// GetFormattedTimestamp returns a human-readable timestamp
func (b Block) GetFormattedTimestamp() string {
	return b.GetTimestamp().Format("2006-01-02 15:04:05 MST")
}

// IsValid checks if the block is valid
func (b Block) IsValid() bool {
	return b.Hash == b.CalculateHash()
}
