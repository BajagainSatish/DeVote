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
	listeners []chan Transaction
}

// BlockchainStats provides statistics about the blockchain
type BlockchainStats struct {
	TotalBlocks       int                     `json:"totalBlocks"`
	TotalTransactions int                     `json:"totalTransactions"`
	TransactionTypes  map[TransactionType]int `json:"transactionTypes"`
	LastBlockTime     time.Time               `json:"lastBlockTime"`
	ChainIntegrity    bool                    `json:"chainIntegrity"`
	InvalidBlocks     []int                   `json:"invalidBlocks,omitempty"`
}

// IntegrityReport provides detailed integrity information
type IntegrityReport struct {
	IsValid       bool               `json:"isValid"`
	TotalBlocks   int                `json:"totalBlocks"`
	ValidBlocks   int                `json:"validBlocks"`
	InvalidBlocks []InvalidBlockInfo `json:"invalidBlocks"`
	CheckedAt     time.Time          `json:"checkedAt"`
}

// InvalidBlockInfo contains information about invalid blocks
type InvalidBlockInfo struct {
	Index        int    `json:"index"`
	Reason       string `json:"reason"`
	ExpectedHash string `json:"expectedHash"`
	ActualHash   string `json:"actualHash"`
}

// CreateGenesisBlock creates the very first block in the chain
func CreateGenesisBlock() Block {
	now := time.Now()
	genesis := Block{
		Index:        0,
		Timestamp:    now.Format(time.RFC3339),
		PrevHash:     "",
		Transactions: []Transaction{},
		CreatedAt:    now,
	}
	genesis.GenerateHash()

	log.Printf("Genesis block created at: %s", genesis.GetFormattedTimestamp())
	return genesis
}

// NewBlockchain creates a new blockchain instance
func NewBlockchain() *Blockchain {
	InitDB()
	blocks, err := LoadBlocks()
	if err != nil || len(blocks) == 0 {
		log.Println("Creating new blockchain with genesis block")
		genesis := CreateGenesisBlock()
		SaveBlock(genesis)
		return &Blockchain{
			Chain:     []Block{genesis},
			listeners: make([]chan Transaction, 0),
		}
	}

	log.Printf("Loaded existing blockchain with %d blocks", len(blocks))
	return &Blockchain{
		Chain:     blocks,
		listeners: make([]chan Transaction, 0),
	}
}

// AddBlock adds a new block to the blockchain with proper timestamp
func (bc *Blockchain) AddBlock(transactions []Transaction) {
	bc.mutex.Lock()
	defer bc.mutex.Unlock()

	if len(bc.Chain) == 0 {
		log.Println("Warning: Empty blockchain, creating genesis block first")
		genesis := CreateGenesisBlock()
		bc.Chain = append(bc.Chain, genesis)
		SaveBlock(genesis)
	}

	lastBlock := bc.Chain[len(bc.Chain)-1]
	newBlock := NewBlock(len(bc.Chain), lastBlock.Hash, transactions)

	bc.Chain = append(bc.Chain, newBlock)
	SaveBlock(newBlock)

	// Notify listeners about new transactions
	for _, tx := range transactions {
		bc.notifyListeners(tx)
	}

	log.Printf("New block added: Index=%d, Hash=%s, Timestamp=%s, Transactions=%d",
		newBlock.Index, newBlock.Hash, newBlock.GetFormattedTimestamp(), len(transactions))
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

	report := bc.getIntegrityReport()

	stats := BlockchainStats{
		TotalBlocks:      len(bc.Chain),
		TransactionTypes: make(map[TransactionType]int),
		ChainIntegrity:   report.IsValid,
	}

	if !report.IsValid {
		stats.InvalidBlocks = make([]int, len(report.InvalidBlocks))
		for i, invalid := range report.InvalidBlocks {
			stats.InvalidBlocks[i] = invalid.Index
		}
	}

	for _, block := range bc.Chain {
		stats.TotalTransactions += len(block.Transactions)
		for _, tx := range block.Transactions {
			stats.TransactionTypes[tx.Data.Type]++
		}
	}

	if len(bc.Chain) > 0 {
		lastBlock := bc.Chain[len(bc.Chain)-1]
		stats.LastBlockTime = lastBlock.GetTimestamp()
	}

	return stats
}

// GetIntegrityReport returns detailed integrity information
func (bc *Blockchain) GetIntegrityReport() IntegrityReport {
	bc.mutex.RLock()
	defer bc.mutex.RUnlock()

	return bc.getIntegrityReport()
}

// getIntegrityReport performs the actual integrity check (internal method)
func (bc *Blockchain) getIntegrityReport() IntegrityReport {
	report := IntegrityReport{
		IsValid:       true,
		TotalBlocks:   len(bc.Chain),
		ValidBlocks:   0,
		InvalidBlocks: []InvalidBlockInfo{},
		CheckedAt:     time.Now(),
	}

	for i, block := range bc.Chain {
		// Check if block hash is valid
		expectedHash := block.CalculateHash()
		if block.Hash != expectedHash {
			report.IsValid = false
			report.InvalidBlocks = append(report.InvalidBlocks, InvalidBlockInfo{
				Index:        block.Index,
				Reason:       "Invalid block hash",
				ExpectedHash: expectedHash,
				ActualHash:   block.Hash,
			})
			continue
		}

		// Check if block links to previous block correctly (skip genesis block)
		if i > 0 {
			prevBlock := bc.Chain[i-1]
			if block.PrevHash != prevBlock.Hash {
				report.IsValid = false
				report.InvalidBlocks = append(report.InvalidBlocks, InvalidBlockInfo{
					Index:        block.Index,
					Reason:       "Invalid previous block hash",
					ExpectedHash: prevBlock.Hash,
					ActualHash:   block.PrevHash,
				})
				continue
			}
		}

		report.ValidBlocks++
	}

	return report
}

// VerifyChainIntegrity checks if the blockchain is valid (legacy method)
func (bc *Blockchain) verifyChainIntegrity() bool {
	return bc.getIntegrityReport().IsValid
}

// Subscribe adds a listener for real-time transaction notifications
func (bc *Blockchain) Subscribe() chan Transaction {
	bc.mutex.Lock()
	defer bc.mutex.Unlock()

	listener := make(chan Transaction, 100)
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
