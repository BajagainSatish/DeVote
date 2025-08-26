// Test script to demonstrate the new transaction queue functionality
package main

import (
	"e-voting-blockchain/blockchain"
	"fmt"
	"time"
)

func main() {
	fmt.Println("=== Testing Blockchain Transaction Queue ===")

	// Create new blockchain
	bc := blockchain.NewBlockchain()
	defer bc.StopBlockTimer()

	fmt.Printf("Genesis block created. Hash: %s\n", bc.GetLatestBlock().Hash)
	fmt.Printf("Genesis block nonce: %d\n", bc.GetLatestBlock().Nonce)

	// Set shorter block interval for testing (10 seconds)
	bc.SetBlockInterval(10 * time.Second)

	// Add some transactions to the queue
	fmt.Println("\n=== Adding transactions to queue ===")

	tx1 := blockchain.NewTransaction("voter1", "candidate1", "VOTE")
	tx2 := blockchain.NewTransaction("voter2", "candidate1", "VOTE")
	tx3 := blockchain.NewTransaction("voter3", "candidate2", "VOTE")

	bc.AddTransaction(tx1)
	bc.AddTransaction(tx2)
	bc.AddTransaction(tx3)

	fmt.Printf("Pending transactions: %d\n", bc.GetPendingTransactionCount())

	// Wait for automatic block creation
	fmt.Println("\n=== Waiting for automatic block creation ===")
	time.Sleep(12 * time.Second)

	fmt.Printf("Blocks in chain: %d\n", len(bc.Blocks))
	fmt.Printf("Pending transactions: %d\n", bc.GetPendingTransactionCount())

	// Add more transactions
	fmt.Println("\n=== Adding more transactions ===")
	tx4 := blockchain.NewTransaction("voter4", "candidate2", "VOTE")
	tx5 := blockchain.NewTransaction("admin", "candidate3", "ADD_CANDIDATE:John Smith:Experienced leader")

	bc.AddTransaction(tx4)
	bc.AddTransaction(tx5)

	// Force block creation
	fmt.Println("\n=== Forcing block creation ===")
	bc.ForceCreateBlock()

	fmt.Printf("Final blocks in chain: %d\n", len(bc.Blocks))
	fmt.Printf("Final pending transactions: %d\n", bc.GetPendingTransactionCount())

	// Verify chain integrity
	fmt.Println("\n=== Verifying chain integrity ===")
	if bc.VerifyChainIntegrity() {
		fmt.Println("✓ Blockchain integrity verified!")
	} else {
		fmt.Println("✗ Blockchain integrity check failed!")
	}

	// Display all blocks
	fmt.Println("\n=== Blockchain Summary ===")
	for i, block := range bc.Blocks {
		fmt.Printf("Block #%d: %d transactions, Hash: %s, Nonce: %d\n",
			i, len(block.Transactions), block.Hash[:16]+"...", block.Nonce)
	}
}
