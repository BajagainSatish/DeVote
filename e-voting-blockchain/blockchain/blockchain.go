package blockchain

import "time" // Provides current time

// Blockchain represents the entire chain of blocks.
type Blockchain struct {
	Chain []Block // Slice (list) of all blocks, starting from the genesis block
}

// CreateGenesisBlock creates the very first block in the chain.
// This block has no previous block, so PrevHash is empty.
func CreateGenesisBlock() Block {
	genesis := Block{
		Index:        0,
		Timestamp:    time.Now().String(), // Capture current time
		PrevHash:     "",
		Transactions: []Transaction{}, // Empty transaction list
	}
	genesis.GenerateHash()
	return genesis
}

// NewBlockchain initializes a blockchain with the genesis block.
func NewBlockchain() *Blockchain {
	return &Blockchain{
		Chain: []Block{CreateGenesisBlock()},
	}
}

// AddBlock creates a new block with the given transactions
// and appends it to the chain.
func (bc *Blockchain) AddBlock(transactions []Transaction) {
	// Get the last block in the chain
	lastBlock := bc.Chain[len(bc.Chain)-1]

	// Create a new block
	newBlock := Block{
		Index:        len(bc.Chain),       // Index = current length of chain
		Timestamp:    time.Now().String(), // Timestamp
		PrevHash:     lastBlock.Hash,      // Link to previous block
		Transactions: transactions,        // Transactions passed in
	}

	// Generate hash for the new block
	newBlock.GenerateHash()

	// Add the block to the chain
	bc.Chain = append(bc.Chain, newBlock)
}
