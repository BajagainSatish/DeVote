// scripts/test_merkle.go - Test script for Merkle Tree functionality
package main

import (
	"fmt"
	"log"

	"e-voting-blockchain/blockchain"
)

func main() {
	fmt.Println("Testing Merkle Tree Implementation...")

	// Test 1: Empty transactions
	fmt.Println("\n--- Test 1: Empty Transactions ---")
	emptyTxs := []blockchain.Transaction{}
	emptyRoot := blockchain.ComputeMerkleRoot(emptyTxs)
	fmt.Printf("Empty transactions Merkle Root: %s\n", emptyRoot)

	// Test 2: Single transaction
	fmt.Println("\n--- Test 2: Single Transaction ---")
	tx1 := blockchain.NewTransaction("voter1", "candidate_A", "VOTE")
	singleTx := []blockchain.Transaction{tx1}
	singleRoot := blockchain.ComputeMerkleRoot(singleTx)
	fmt.Printf("Single transaction Merkle Root: %s\n", singleRoot)

	// Test 3: Multiple transactions
	fmt.Println("\n--- Test 3: Multiple Transactions ---")
	tx2 := blockchain.NewTransaction("voter2", "candidate_B", "VOTE")
	tx3 := blockchain.NewTransaction("voter3", "candidate_A", "VOTE")
	tx4 := blockchain.NewTransaction("voter4", "candidate_C", "VOTE")

	multiTxs := []blockchain.Transaction{tx1, tx2, tx3, tx4}
	multiRoot := blockchain.ComputeMerkleRoot(multiTxs)
	fmt.Printf("Multiple transactions Merkle Root: %s\n", multiRoot)

	// Test 4: Merkle Proof Generation and Verification
	fmt.Println("\n--- Test 4: Merkle Proof ---")
	tree := blockchain.NewMerkleTree(multiTxs)
	proof, err := tree.GenerateMerkleProof(tx2) // Pass full Transaction
	if err != nil {
		log.Printf("Error generating proof: %v", err)
	} else {
		fmt.Printf("Generated proof for tx2: %v\n", proof)

		// Verify the proof
		isValid := blockchain.VerifyMerkleProof(tx2, proof, multiRoot) // Pass full Transaction
		fmt.Printf("Proof verification result: %v\n", isValid)
	}

	// Test 5: Block with Merkle Root
	fmt.Println("\n--- Test 5: Block Creation with Merkle Root ---")
	block := blockchain.NewBlock(1, multiTxs, "genesis_hash")
	fmt.Printf("Block Merkle Root: %s\n", block.MerkleRoot)
	fmt.Printf("Block integrity: %v\n", block.VerifyBlockIntegrity())

	// Test 6: Transaction verification in block
	fmt.Println("\n--- Test 6: Transaction Verification in Block ---")
	for i, tx := range multiTxs {
		included, err := block.VerifyTransactionInBlock(tx.ID)
		if err != nil {
			log.Printf("Error verifying transaction %d: %v", i, err)
		} else {
			fmt.Printf("Transaction %d included: %v\n", i, included)
		}
	}

	fmt.Println("\nAll tests completed!")
}
