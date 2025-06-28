// utility script for debugging/inspection

package main

import (
	"e-voting-blockchain/blockchain"
	"e-voting-blockchain/contracts"
	"encoding/json"
	"fmt"
)

func main() {
	// Load blockchain
	blockchain.InitDB()
	blocks, _ := blockchain.LoadBlocks()
	fmt.Println("BLOCKCHAIN:")
	for _, block := range blocks {
		b, _ := json.MarshalIndent(block, "", "  ")
		fmt.Println(string(b))
	}

	// Load election state
	election, err := contracts.LoadElection()
	if err != nil {
		fmt.Println("Error loading election.json:", err)
		return
	}

	fmt.Println("\nCANDIDATE VOTES:")
	for name, votes := range election.Candidates {
		fmt.Printf("%s: %d\n", name, votes)
	}

	fmt.Println("\nVOTERS WHO VOTED:")
	for voterID := range election.Voters {
		fmt.Println("-", voterID)
	}
}
