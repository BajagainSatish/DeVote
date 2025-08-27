// examples/merkle_demo.go
package main

import (
	"fmt"

	"e-voting-blockchain/blockchain"
)

func main() {
	fmt.Println("=== Blockchain Merkle Tree Demo ===\n")

	// Create some sample transactions (votes)
	tx1 := blockchain.NewTransaction("voter1", "candidate_A", "VOTE")
	tx2 := blockchain.NewTransaction("voter2", "candidate_B", "VOTE")
	tx3 := blockchain.NewTransaction("voter3", "candidate_A", "VOTE")
	tx4 := blockchain.NewTransaction("voter4", "candidate_C", "VOTE")

	transactions := []blockchain.Transaction{tx1, tx2, tx3, tx4}

	fmt.Println("1. Creating a new block with transactions...")
	block := blockchain.NewBlock(1, transactions, "previous_hash_example")

	fmt.Printf("Block Index: %d\n", block.Index)
	fmt.Printf("Block Hash: %s\n", block.Hash)
	fmt.Printf("Merkle Root: %s\n", block.MerkleRoot)
	fmt.Printf("Number of Transactions: %d\n\n", len(block.Transactions))

	// Verify block integrity
	fmt.Println("2. Verifying block integrity...")
	isValid := block.VerifyBlockIntegrity()
	fmt.Printf("Block integrity valid: %v\n\n", isValid)

	// Verify specific transaction inclusion
	fmt.Println("3. Verifying transaction inclusion...")
	txToVerify := tx2.ID
	fmt.Printf("Verifying transaction: %s\n", txToVerify)

	included, err := block.VerifyTransactionInBlock(txToVerify)
	if err != nil {
		fmt.Printf("Error verifying transaction: %v\n", err)
	} else {
		fmt.Printf("Transaction included in block: %v\n\n", included)
	}

	// Demonstrate tampering detection
	fmt.Println("4. Demonstrating tampering detection...")
	block.DemonstrateIntegrityBreach()

	fmt.Println("\n5. Creating and verifying blockchain...")
	bc := blockchain.NewBlockchain()
	bc.AddBlock(transactions)

	fmt.Printf("Blockchain length: %d\n", len(bc.Blocks))
	fmt.Printf("Chain integrity valid: %v\n", bc.VerifyChainIntegrity())

	// Save blockchain
	err = bc.SaveToFile("demo_chain.json")
	if err != nil {
		fmt.Printf("Error saving blockchain: %v\n", err)
	} else {
		fmt.Println("Blockchain saved to demo_chain.json")
	}
}
