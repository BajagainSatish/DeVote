// block.go

package blockchain

import (
	"crypto/sha256" // Package used to generate secure hash using SHA-256 algorithm
	"encoding/hex"  // Converts hash bytes into readable hexadecimal string
	"strconv"       // Used to convert int to string (e.g., Index to string)
)

// Block represents one unit in the blockchain.
// A block stores multiple transactions and links to the previous block using its hash.
type Block struct {
	Index        int           // Position of the block in the chain (0 = genesis block)
	Timestamp    string        // Time at which the block was created
	Transactions []Transaction // Slice (list) of transactions contained in this block
	PrevHash     string        // Hash of the previous block (links the chain)
	Hash         string        // Hash of the current block (used for integrity)
}

// GenerateHash calculates the SHA-256 hash of this block's contents.
// This ensures the block’s data has not been tampered with.
func (b *Block) GenerateHash() {
	// Concatenate block data as a single string
	data := strconv.Itoa(b.Index) + b.Timestamp + b.PrevHash + b.TransactionData()

	// Create SHA-256 hash of the data
	hash := sha256.Sum256([]byte(data))

	// Convert byte array to hexadecimal string
	b.Hash = hex.EncodeToString(hash[:])
}

// TransactionData combines all transaction info into a single string.
// This is used as part of the data to generate the block's hash.
func (b *Block) TransactionData() string {
	var txData string

	// For each transaction, append all fields to a string
	for _, tx := range b.Transactions {
		txData += tx.ID + tx.Sender + tx.Receiver + tx.Payload
	}

	return txData
}
