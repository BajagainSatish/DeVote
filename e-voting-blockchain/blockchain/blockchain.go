// blockchain.go
package blockchain

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"
)

// Blockchain represents the entire chain of blocks
type Blockchain struct {
	Blocks              []Block       `json:"blocks"`
	PendingTransactions []Transaction `json:"pending_transactions"` // Added pending transaction queue
	mutex               sync.RWMutex  // Added mutex for thread safety
	blockTimer          *time.Timer   // Added timer for periodic block creation
	blockInterval       time.Duration // Added configurable block creation interval
}

// CreateGenesisBlock creates the very first block in the chain.
// This block has no previous block, so PrevHash is empty.
func CreateGenesisBlock() Block {
	genesis := Block{
		Index:        0,
		Timestamp:    time.Now().Format(time.RFC3339), // Use RFC3339 format for consistency
		PrevHash:     "",
		Transactions: []Transaction{},                    // Empty transaction list
		MerkleRoot:   ComputeMerkleRoot([]Transaction{}), // Compute Merkle root for empty transactions
		Nonce:        0,                                  // Initialize nonce properly
	}

	genesis.MineBlock(2) // Use difficulty of 2 for genesis block
	return genesis
}

// NewBlockchain creates a new blockchain with database integration
func NewBlockchain() *Blockchain {
	InitDB() // Open DB

	blocks, err := LoadBlocks()

	bc := &Blockchain{
		PendingTransactions: make([]Transaction, 0), // Initialize pending transactions queue
		blockInterval:       30 * time.Second,       // Set default block creation interval to 30 seconds
	}

	if err != nil || len(blocks) == 0 {
		// No blocks in DB, create genesis
		genesis := CreateGenesisBlock()
		SaveBlock(genesis)
		bc.Blocks = []Block{genesis}
	} else {
		bc.Blocks = blocks
		bc.RecomputeMerkleRootsAndHashes()
	}

	bc.startBlockTimer()

	return bc
}

func (bc *Blockchain) startBlockTimer() {
	bc.blockTimer = time.AfterFunc(bc.blockInterval, func() {
		bc.createBlockFromPendingTransactions()
		bc.startBlockTimer() // Restart timer for next interval
	})
}

func (bc *Blockchain) StopBlockTimer() {
	if bc.blockTimer != nil {
		bc.blockTimer.Stop()
	}
}

func (bc *Blockchain) AddTransaction(transaction Transaction) {
	bc.mutex.Lock()
	defer bc.mutex.Unlock()

	bc.PendingTransactions = append(bc.PendingTransactions, transaction)
	fmt.Printf("Transaction %s added to pending queue. Queue size: %d\n", transaction.ID, len(bc.PendingTransactions))
}

func (bc *Blockchain) createBlockFromPendingTransactions() {
	bc.mutex.Lock()
	defer bc.mutex.Unlock()

	// Only create block if there are pending transactions
	if len(bc.PendingTransactions) == 0 {
		fmt.Println("No pending transactions, skipping block creation")
		return
	}

	// Get all pending transactions for the new block
	transactions := make([]Transaction, len(bc.PendingTransactions))
	copy(transactions, bc.PendingTransactions)

	// Create new block with all pending transactions
	lastBlock := bc.Blocks[len(bc.Blocks)-1]

	newBlock := Block{
		Index:        len(bc.Blocks),
		Timestamp:    time.Now().Format(time.RFC3339),
		PrevHash:     lastBlock.Hash,
		Transactions: transactions,
		MerkleRoot:   ComputeMerkleRoot(transactions),
		Nonce:        0,
	}

	fmt.Printf("Mining new block with %d transactions...\n", len(transactions))
	newBlock.MineBlock(2) // Use difficulty of 2

	bc.Blocks = append(bc.Blocks, newBlock)

	// Clear pending transactions
	bc.PendingTransactions = make([]Transaction, 0)

	// Save to DB
	SaveBlock(newBlock)

	fmt.Printf("Block #%d created with %d transactions. Hash: %s\n", newBlock.Index, len(transactions), newBlock.Hash)
}

// AddBlock adds a new block to the blockchain with database persistence
// This method is now primarily used for manual block creation or testing
func (bc *Blockchain) AddBlock(transactions []Transaction) {
	bc.mutex.Lock()
	defer bc.mutex.Unlock()

	lastBlock := bc.Blocks[len(bc.Blocks)-1]

	newBlock := Block{
		Index:        len(bc.Blocks),
		Timestamp:    time.Now().Format(time.RFC3339), // Use RFC3339 format
		PrevHash:     lastBlock.Hash,
		Transactions: transactions,
		MerkleRoot:   ComputeMerkleRoot(transactions),
		Nonce:        0, // Initialize nonce
	}

	newBlock.MineBlock(2)

	bc.Blocks = append(bc.Blocks, newBlock)

	// Save to DB
	SaveBlock(newBlock)
}

func (bc *Blockchain) ForceCreateBlock() {
	fmt.Println("Forcing block creation...")
	bc.createBlockFromPendingTransactions()
}

func (bc *Blockchain) GetPendingTransactionCount() int {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()
	return len(bc.PendingTransactions)
}

func (bc *Blockchain) GetPendingTransactions() []Transaction {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()

	transactions := make([]Transaction, len(bc.PendingTransactions))
	copy(transactions, bc.PendingTransactions)
	return transactions
}

func (bc *Blockchain) SetBlockInterval(interval time.Duration) {
	bc.mutex.Lock()
	defer bc.mutex.Unlock()

	bc.blockInterval = interval

	// Restart timer with new interval
	if bc.blockTimer != nil {
		bc.blockTimer.Stop()
	}
	bc.startBlockTimer()

	fmt.Printf("Block creation interval set to %v\n", interval)
}

// GetLatestBlock returns the most recent block in the chain
func (bc *Blockchain) GetLatestBlock() Block {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()
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

func (bc *Blockchain) RecomputeMerkleRootsAndHashes() error {
	bc.mutex.Lock()
	defer bc.mutex.Unlock()

	for i := range bc.Blocks {
		b := &bc.Blocks[i]
		b.MerkleRoot = ComputeMerkleRoot(b.Transactions) // uses new merkle.go hashTransaction
		b.GenerateHash()                                 // recalc block Hash using Timestamp/PrevHash/MerkleRoot/Nonce
		if err := SaveBlock(*b); err != nil {
			return err
		}
		fmt.Printf("Recomputed Block #%d MerkleRoot: %s\n", b.Index, b.MerkleRoot)
	}
	return nil
}
