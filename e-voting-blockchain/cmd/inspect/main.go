//inspect/main.go

package main

import (
	"encoding/json"
	"fmt"
	"strings"

	"e-voting-blockchain/blockchain"
	"e-voting-blockchain/contracts"
)

func main() {
	fmt.Println("========== BLOCKCHAIN ==========")

	// Init DB
	blockchain.InitDB()
	fmt.Println("DB initialized.")

	// Try loading blocks
	blocks, err := blockchain.LoadBlocks()
	if err != nil {
		fmt.Println("Error loading blocks:", err)
		return
	}

	fmt.Printf("Blocks loaded: %d\n", len(blocks))
	if len(blocks) == 0 {
		fmt.Println("No blocks found in the DB!")
		return
	}

	for _, block := range blocks {
		fmt.Printf("\n--- Block #%d ---\n", block.Index)
		fmt.Printf("Timestamp : %s\n", block.Timestamp)
		fmt.Printf("Hash      : %s\n", block.Hash)
		fmt.Printf("PrevHash  : %s\n", block.PrevHash)
		fmt.Printf("Transactions (%d):\n", len(block.Transactions))

		for _, tx := range block.Transactions {
			printTransaction(tx)
		}

		// Debug: show raw JSON
		b, _ := json.MarshalIndent(block, "", "  ")
		fmt.Println("Block JSON:", string(b))
	}

	fmt.Println("\n========== ELECTION STATE ==========")
	election, err := contracts.LoadElection()
	if err != nil {
		fmt.Println("Error loading election.json:", err)
		return
	}
	fmt.Println("Election loaded:", election)
}

func printTransaction(tx blockchain.Transaction) {
	txType := tx.Type
	if txType == "" {
		txType = guessTransactionType(tx.Payload)
	}

	switch txType {
	case "VOTE":
		fmt.Printf("  [VOTE] %s -> %s (txID: %s)\n", tx.Sender, tx.Receiver, tx.ID)
	case "ADD_CANDIDATE":
		parts := strings.SplitN(tx.Payload, ":", 3)
		if len(parts) == 3 {
			fmt.Printf("  [ADD] '%s' (ID: %s) Bio: %s\n", parts[1], tx.Receiver, parts[2])
		}
	case "UPDATE_CANDIDATE":
		parts := strings.SplitN(tx.Payload, ":", 3)
		if len(parts) == 3 {
			fmt.Printf("  [UPDATE] '%s' (ID: %s) Bio: %s\n", parts[1], tx.Receiver, parts[2])
		}
	case "REMOVE_CANDIDATE":
		fmt.Printf("  [REMOVE] Candidate ID: %s\n", tx.Receiver)
	default:
		b, _ := json.MarshalIndent(tx, "", "  ")
		fmt.Println("  [UNKNOWN TX] JSON:", string(b))
	}
}

func guessTransactionType(payload string) string {
	switch {
	case payload == "VOTE":
		return "VOTE"
	case strings.HasPrefix(payload, "ADD_CANDIDATE:"):
		return "ADD_CANDIDATE"
	case strings.HasPrefix(payload, "UPDATE_CANDIDATE:"):
		return "UPDATE_CANDIDATE"
	case payload == "REMOVE_CANDIDATE":
		return "REMOVE_CANDIDATE"
	default:
		return "UNKNOWN"
	}
}
