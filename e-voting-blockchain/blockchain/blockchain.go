package blockchain

import (
	"log"
	"sync"
	"time"
)

// Blockchain represents the entire chain of blocks
type Blockchain struct {
	Chain     []Block `json:"chain"`
	mutex     sync.RWMutex
	listeners []chan Transaction // For real-time notifications
}

// BlockchainStats provides statistics about the blockchain
type BlockchainStats struct {
	TotalBlocks       int                     `json:"totalBlocks"`
	TotalTransactions int                     `json:"totalTransactions"`
	TransactionTypes  map[TransactionType]int `json:"transactionTypes"`
	LastBlockTime     time.Time               `json:"lastBlockTime"`
	ChainIntegrity    bool                    `json:"chainIntegrity"`
}

// CreateGenesisBlock creates the very first block in the chain
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

// NewBlockchain creates a new blockchain instance
func NewBlockchain() *Blockchain {
	InitDB() // Open DB
	blocks, err := LoadBlocks()
	if err != nil || len(blocks) == 0 {
		// No blocks in DB, create genesis
		genesis := CreateGenesisBlock()
		SaveBlock(genesis)
		return &Blockchain{
			Chain:     []Block{genesis},
			listeners: make([]chan Transaction, 0),
		}
	}
	return &Blockchain{
		Chain:     blocks,
		listeners: make([]chan Transaction, 0),
	}
}

// AddBlock adds a new block to the blockchain with thread safety
func (bc *Blockchain) AddBlock(transactions []Transaction) {
	bc.mutex.Lock()
	defer bc.mutex.Unlock()

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

	// Notify listeners about new transactions
	for _, tx := range transactions {
		bc.notifyListeners(tx)
	}

	log.Printf("New block added: Index=%d, Hash=%s, Transactions=%d",
		newBlock.Index, newBlock.Hash, len(transactions))
}

// AddTransaction adds a single transaction to the blockchain
func (bc *Blockchain) AddTransaction(tx Transaction) {
	bc.AddBlock([]Transaction{tx})
}

// GetAllTransactions returns all transactions from all blocks
func (bc *Blockchain) GetAllTransactions() []Transaction {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()

	var allTransactions []Transaction
	for _, block := range bc.Chain {
		allTransactions = append(allTransactions, block.Transactions...)
	}
	return allTransactions
}

// GetTransactionsByType returns transactions filtered by type
func (bc *Blockchain) GetTransactionsByType(txType TransactionType) []Transaction {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()

	var filtered []Transaction
	for _, block := range bc.Chain {
		for _, tx := range block.Transactions {
			if tx.Data.Type == txType {
				filtered = append(filtered, tx)
			}
		}
	}
	return filtered
}

// GetTransactionsByActor returns transactions performed by a specific actor
func (bc *Blockchain) GetTransactionsByActor(actor string) []Transaction {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()

	var filtered []Transaction
	for _, block := range bc.Chain {
		for _, tx := range block.Transactions {
			if tx.Data.Actor == actor {
				filtered = append(filtered, tx)
			}
		}
	}
	return filtered
}

// GetRecentTransactions returns the most recent N transactions
func (bc *Blockchain) GetRecentTransactions(limit int) []Transaction {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()

	allTx := bc.GetAllTransactions()
	if len(allTx) <= limit {
		return allTx
	}
	return allTx[len(allTx)-limit:]
}

// GetStats returns blockchain statistics
func (bc *Blockchain) GetStats() BlockchainStats {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()

	stats := BlockchainStats{
		TotalBlocks:      len(bc.Chain),
		TransactionTypes: make(map[TransactionType]int),
		ChainIntegrity:   bc.verifyChainIntegrity(),
	}

	for _, block := range bc.Chain {
		stats.TotalTransactions += len(block.Transactions)
		for _, tx := range block.Transactions {
			stats.TransactionTypes[tx.Data.Type]++
		}
	}

	if len(bc.Chain) > 0 {
		lastBlock := bc.Chain[len(bc.Chain)-1]
		if timestamp, err := time.Parse(time.RFC3339, lastBlock.Timestamp); err == nil {
			stats.LastBlockTime = timestamp
		}
	}

	return stats
}

// VerifyChainIntegrity checks if the blockchain is valid
func (bc *Blockchain) verifyChainIntegrity() bool {
	for i := 1; i < len(bc.Chain); i++ {
		currentBlock := bc.Chain[i]
		prevBlock := bc.Chain[i-1]

		// Verify hash
		originalHash := currentBlock.Hash
		currentBlock.GenerateHash()
		if originalHash != currentBlock.Hash {
			return false
		}

		// Verify link to previous block
		if currentBlock.PrevHash != prevBlock.Hash {
			return false
		}
	}
	return true
}

// Subscribe adds a listener for real-time transaction notifications
func (bc *Blockchain) Subscribe() chan Transaction {
	bc.mutex.Lock()
	defer bc.mutex.Unlock()

	listener := make(chan Transaction, 100) // Buffered channel
	bc.listeners = append(bc.listeners, listener)
	return listener
}

// Unsubscribe removes a listener
func (bc *Blockchain) Unsubscribe(listener chan Transaction) {
	bc.mutex.Lock()
	defer bc.mutex.Unlock()

	for i, l := range bc.listeners {
		if l == listener {
			close(l)
			bc.listeners = append(bc.listeners[:i], bc.listeners[i+1:]...)
			break
		}
	}
}

// notifyListeners sends transaction to all subscribers
func (bc *Blockchain) notifyListeners(tx Transaction) {
	for _, listener := range bc.listeners {
		select {
		case listener <- tx:
		default:
			// Channel is full, skip this listener
			log.Printf("Warning: Blockchain listener channel is full")
		}
	}
}

// GetTransactionByID finds a transaction by its ID
func (bc *Blockchain) GetTransactionByID(txID string) (*Transaction, error) {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()

	for _, block := range bc.Chain {
		for _, tx := range block.Transactions {
			if tx.ID == txID {
				return &tx, nil
			}
		}
	}
	return nil, nil
}

// GetBlockByIndex returns a block by its index
func (bc *Blockchain) GetBlockByIndex(index int) (*Block, error) {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()

	if index < 0 || index >= len(bc.Chain) {
		return nil, nil
	}
	return &bc.Chain[index], nil
}
