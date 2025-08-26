// blockchain.go
package blockchain

import (
	"encoding/json"
	"fmt"
	"os"
	"time" // Adding time import for CreateGenesisBlock
)

// Blockchain represents the entire chain of blocks
type Blockchain struct {
	Blocks []Block `json:"blocks"`
}

// CreateGenesisBlock creates the very first block in the chain.
// This block has no previous block, so PrevHash is empty.
func CreateGenesisBlock() Block {
	genesis := Block{
		Index:        0,
		Timestamp:    time.Now().String(), // Capture current time
		PrevHash:     "",
		Transactions: []Transaction{},                    // Empty transaction list
		MerkleRoot:   ComputeMerkleRoot([]Transaction{}), // Compute Merkle root for empty transactions
	}
	genesis.GenerateHash()
	return genesis
}

// NewBlockchain creates a new blockchain with database integration
func NewBlockchain() *Blockchain {
	InitDB() // Open DB

	blocks, err := LoadBlocks()
	if err != nil || len(blocks) == 0 {
		// No blocks in DB, create genesis
		genesis := CreateGenesisBlock()
		SaveBlock(genesis)
		return &Blockchain{Blocks: []Block{genesis}}
	}

	return &Blockchain{Blocks: blocks}
}

// AddBlock adds a new block to the blockchain with database persistence
func (bc *Blockchain) AddBlock(transactions []Transaction) {
	lastBlock := bc.Blocks[len(bc.Blocks)-1]

	newBlock := Block{
		Index:        len(bc.Blocks),
		Timestamp:    time.Now().String(),
		PrevHash:     lastBlock.Hash,
		Transactions: transactions,
		MerkleRoot:   ComputeMerkleRoot(transactions), // Compute Merkle root
	}
	newBlock.GenerateHash()

	bc.Blocks = append(bc.Blocks, newBlock)

	// Save to DB
	SaveBlock(newBlock)
}

// GetLatestBlock returns the most recent block in the chain
func (bc *Blockchain) GetLatestBlock() Block {
	return bc.Blocks[len(bc.Blocks)-1]
}

// VerifyChainIntegrity verifies the integrity of the entire blockchain
func (bc *Blockchain) VerifyChainIntegrity() bool {
	for i := 1; i < len(bc.Blocks); i++ {
		currentBlock := bc.Blocks[i]
		prevBlock := bc.Blocks[i-1]

		// Verify current block integrity
		if !currentBlock.VerifyBlockIntegrity() {
			fmt.Printf("Block %d failed integrity check\n", i)
			return false
		}

		// Verify chain linkage
		if currentBlock.PrevHash != prevBlock.Hash {
			fmt.Printf("Block %d has invalid previous hash\n", i)
			return false
		}
	}
	return true
}

// SaveToFile saves the blockchain to a JSON file
func (bc *Blockchain) SaveToFile(filename string) error {
	data, err := json.MarshalIndent(bc, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filename, data, 0644)
}

// LoadFromFile loads the blockchain from a JSON file
func LoadFromFile(filename string) (*Blockchain, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	var bc Blockchain
	err = json.Unmarshal(data, &bc)
	if err != nil {
		return nil, err
	}

	return &bc, nil
}
