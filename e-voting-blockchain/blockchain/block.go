// block.go
package blockchain

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strconv"
	"time"
)

// Block represents a single block in the blockchain
type Block struct {
	Index        int           `json:"Index"`                // Position of the block in the chain (0 = genesis block)
	Timestamp    string        `json:"Timestamp"`            // Time at which the block was created
	Transactions []Transaction `json:"Transactions"`         // Slice (list) of transactions contained in this block
	PrevHash     string        `json:"PrevHash"`             // Hash of the previous block (links the chain)
	Hash         string        `json:"Hash"`                 // Hash of the current block (used for integrity)
	Nonce        int           `json:"nonce,omitempty"`      // optional, used in frontend
	MerkleRoot   string        `json:"merkleRoot,omitempty"` // Merkle root for transaction integrity
}

// NewBlock creates a new block with the given transactions and previous hash
func NewBlock(index int, transactions []Transaction, prevHash string) *Block {
	timestamp := time.Now().Format(time.RFC3339)

	// Compute Merkle Root from transactions
	merkleRoot := ComputeMerkleRoot(transactions)

	block := &Block{
		Index:        index,
		Timestamp:    timestamp,
		Transactions: transactions,
		PrevHash:     prevHash,
		MerkleRoot:   merkleRoot,
		Nonce:        0,
	}

	// Calculate block hash
	block.GenerateHash()

	return block
}

// GenerateHash calculates the SHA-256 hash of this block's contents.
// This ensures the block's data has not been tampered with.
func (b *Block) GenerateHash() {
	// Include MerkleRoot in hash calculation for enhanced security
	data := strconv.Itoa(b.Index) + b.Timestamp + b.PrevHash + b.MerkleRoot + strconv.Itoa(b.Nonce)
	hash := sha256.Sum256([]byte(data))
	b.Hash = hex.EncodeToString(hash[:])
}

// calculateHash computes the hash of the block (updated to use GenerateHash)
func (b *Block) calculateHash() string {
	data := strconv.Itoa(b.Index) + b.Timestamp + b.PrevHash + b.MerkleRoot + strconv.Itoa(b.Nonce)
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
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

// VerifyBlockIntegrity verifies the integrity of a block using its Merkle Root
func (b *Block) VerifyBlockIntegrity() bool {
	// Recompute Merkle Root from current transactions
	expectedMerkleRoot := ComputeMerkleRoot(b.Transactions)

	// Check if stored Merkle Root matches computed one
	if b.MerkleRoot != expectedMerkleRoot {
		return false
	}

	// Verify block hash
	expectedHash := b.calculateHash()
	return b.Hash == expectedHash
}

// VerifyTransactionInBlock verifies that a specific transaction is included in this block
func (b *Block) VerifyTransactionInBlock(txID string) (bool, error) {
	// First check if transaction exists in the block
	var txExists bool
	for _, tx := range b.Transactions {
		if tx.ID == txID {
			txExists = true
			break
		}
	}

	if !txExists {
		return false, nil
	}

	// Generate Merkle Tree and proof
	tree := NewMerkleTree(b.Transactions)
	proof, err := tree.GenerateMerkleProof(txID)
	if err != nil {
		return false, err
	}

	// Verify the proof
	return VerifyMerkleProof(txID, proof, b.MerkleRoot), nil
}

// GetTransactionCount returns the number of transactions in the block
func (b *Block) GetTransactionCount() int {
	return len(b.Transactions)
}

// DemonstrateIntegrityBreach shows how tampering breaks verification
func (b *Block) DemonstrateIntegrityBreach() {
	fmt.Printf("Original Block Integrity: %v\n", b.VerifyBlockIntegrity())
	fmt.Printf("Original Merkle Root: %s\n", b.MerkleRoot)

	// Tamper with a transaction
	if len(b.Transactions) > 0 {
		originalReceiver := b.Transactions[0].Receiver
		b.Transactions[0].Receiver = "TAMPERED_CANDIDATE"

		fmt.Printf("After tampering with transaction receiver...\n")
		fmt.Printf("Block Integrity: %v\n", b.VerifyBlockIntegrity())
		fmt.Printf("Current Merkle Root: %s\n", b.MerkleRoot)
		fmt.Printf("Expected Merkle Root: %s\n", ComputeMerkleRoot(b.Transactions))

		// Restore original value
		b.Transactions[0].Receiver = originalReceiver
	}
}
