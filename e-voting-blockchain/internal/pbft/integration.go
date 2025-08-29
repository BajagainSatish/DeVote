package pbft

import (
	"e-voting-blockchain/blockchain"
	"encoding/json"
	"fmt"
	"log"
	"time"
)

// BlockchainIntegration handles the integration between PBFT and blockchain
type BlockchainIntegration struct {
	blockchain *blockchain.Blockchain
	pbftNode   *PBFTNode
}

// NewBlockchainIntegration creates a new integration instance
func NewBlockchainIntegration(bc *blockchain.Blockchain, node *PBFTNode) *BlockchainIntegration {
	integration := &BlockchainIntegration{
		blockchain: bc,
		pbftNode:   node,
	}

	// Set up the callback for when blocks are committed
	node.OnBlockCommitted = integration.handleBlockCommitted

	return integration
}

// handleBlockCommitted processes a block that has achieved PBFT consensus
func (bi *BlockchainIntegration) handleBlockCommitted(blockData interface{}) error {
	// Convert the committed block data back to blockchain.Block
	blockJSON, err := json.Marshal(blockData)
	if err != nil {
		return fmt.Errorf("failed to marshal block data: %v", err)
	}

	var block blockchain.Block
	if err := json.Unmarshal(blockJSON, &block); err != nil {
		return fmt.Errorf("failed to unmarshal block: %v", err)
	}

	// Validate the block before adding it
	if err := bi.validateBlock(&block); err != nil {
		return fmt.Errorf("block validation failed: %v", err)
	}

	// Add the committed block to our blockchain
	bi.blockchain.Blocks = append(bi.blockchain.Blocks, block)

	// Persist to database
	if err := blockchain.SaveBlock(block); err != nil {
		return fmt.Errorf("failed to save block to database: %v", err)
	}

	// Clear the pending transactions that were included in this block
	bi.clearProcessedTransactions(block.Transactions)

	log.Printf("Block #%d committed to blockchain with %d transactions",
		block.Index, len(block.Transactions))

	return nil
}

// validateBlock performs validation on a block before committing
func (bi *BlockchainIntegration) validateBlock(block *blockchain.Block) error {
	// Check if block index is correct
	expectedIndex := len(bi.blockchain.Blocks)
	if block.Index != expectedIndex {
		return fmt.Errorf("invalid block index: expected %d, got %d", expectedIndex, block.Index)
	}

	// Check if previous hash is correct
	if len(bi.blockchain.Blocks) > 0 {
		lastBlock := bi.blockchain.Blocks[len(bi.blockchain.Blocks)-1]
		if block.PrevHash != lastBlock.Hash {
			return fmt.Errorf("invalid previous hash")
		}
	}

	// Verify Merkle root
	expectedMerkleRoot := blockchain.ComputeMerkleRoot(block.Transactions)
	if block.MerkleRoot != expectedMerkleRoot {
		return fmt.Errorf("invalid Merkle root")
	}

	// Validate each transaction
	for _, tx := range block.Transactions {
		if err := bi.validateTransaction(&tx); err != nil {
			return fmt.Errorf("invalid transaction %s: %v", tx.ID, err)
		}
	}

	return nil
}

// validateTransaction validates a single transaction
func (bi *BlockchainIntegration) validateTransaction(tx *blockchain.Transaction) error {
	// Basic validation
	if tx.ID == "" {
		return fmt.Errorf("transaction ID cannot be empty")
	}

	if tx.Sender == "" {
		return fmt.Errorf("transaction sender cannot be empty")
	}

	if tx.Receiver == "" {
		return fmt.Errorf("transaction receiver cannot be empty")
	}

	// For voting transactions, ensure voter hasn't already voted
	if tx.Payload == "VOTE" {
		if bi.hasVoterAlreadyVoted(tx.Sender) {
			return fmt.Errorf("voter %s has already voted", tx.Sender)
		}
	}

	return nil
}

// hasVoterAlreadyVoted checks if a voter has already cast a vote
func (bi *BlockchainIntegration) hasVoterAlreadyVoted(voterID string) bool {
	for _, block := range bi.blockchain.Blocks {
		for _, tx := range block.Transactions {
			if tx.Payload == "VOTE" && tx.Sender == voterID {
				return true
			}
		}
	}
	return false
}

// clearProcessedTransactions removes transactions from pending queue
func (bi *BlockchainIntegration) clearProcessedTransactions(processedTxs []blockchain.Transaction) {
	// Create a map of processed transaction IDs for quick lookup
	processedMap := make(map[string]bool)
	for _, tx := range processedTxs {
		processedMap[tx.ID] = true
	}

	// Filter out processed transactions from pending queue
	var remainingTxs []blockchain.Transaction
	pendingTxs := bi.blockchain.GetPendingTransactions()

	for _, tx := range pendingTxs {
		if !processedMap[tx.ID] {
			remainingTxs = append(remainingTxs, tx)
		}
	}

	// Update the pending transactions (this would need to be implemented in blockchain)
	// For now, we'll clear all pending transactions since they were processed
	bi.blockchain.PendingTransactions = remainingTxs
}

// TriggerConsensusIfNeeded checks if consensus should be triggered
func (bi *BlockchainIntegration) TriggerConsensusIfNeeded() error {
	if !bi.pbftNode.IsPrimary {
		return nil // Only primary can trigger consensus
	}

	pendingCount := bi.blockchain.GetPendingTransactionCount()
	if pendingCount == 0 {
		return nil // No transactions to process
	}

	// Trigger consensus if we have pending transactions
	// and the node is in idle state
	if bi.pbftNode.State == StateIdle {
		return bi.startConsensusForPendingTransactions()
	}

	return nil
}

// startConsensusForPendingTransactions creates a block from pending transactions
func (bi *BlockchainIntegration) startConsensusForPendingTransactions() error {
	pendingTxs := bi.blockchain.GetPendingTransactions()
	if len(pendingTxs) == 0 {
		return fmt.Errorf("no pending transactions")
	}

	// Create a new block
	lastBlock := bi.blockchain.GetLatestBlock()
	newBlock := blockchain.Block{
		Index:        len(bi.blockchain.Blocks),
		Timestamp:    time.Now().Format(time.RFC3339), //blockchain.getCurrentTimestamp()
		PrevHash:     lastBlock.Hash,
		Transactions: pendingTxs,
		MerkleRoot:   blockchain.ComputeMerkleRoot(pendingTxs),
		Nonce:        0,
	}

	// Start PBFT consensus for this block
	return bi.pbftNode.StartConsensus(newBlock)
}
