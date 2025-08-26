//blockchain.go

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

func NewBlockchain() *Blockchain {
	InitDB() // Open DB

	blocks, err := LoadBlocks()
	if err != nil || len(blocks) == 0 {
		// No blocks in DB, create genesis
		genesis := CreateGenesisBlock()
		SaveBlock(genesis)

		return &Blockchain{Chain: []Block{genesis}}
	}

	return &Blockchain{Chain: blocks}
}

func (bc *Blockchain) AddBlock(transactions []Transaction) {
	lastBlock := bc.Chain[len(bc.Chain)-1]

	newBlock := Block{
		Index:        len(bc.Chain),
		Timestamp:    time.Now().String(),
		PrevHash:     lastBlock.Hash,
		Transactions: transactions,
	}
	newBlock.GenerateHash()

	bc.Chain = append(bc.Chain, newBlock)

	// Save to DB
	SaveBlock(newBlock)
}
