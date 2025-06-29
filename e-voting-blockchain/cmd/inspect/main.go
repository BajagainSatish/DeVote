// cmd/inspect/main.go
// Utility script for inspecting blockchain and election state

package main

import (
	"e-voting-blockchain/blockchain"
	"e-voting-blockchain/contracts"
	"fmt"
	"strings"
)

func main() {
	// --- Load and display blockchain data ---
	fmt.Println("========== BLOCKCHAIN ==========")
	blockchain.InitDB()
	blocks, err := blockchain.LoadBlocks()
	if err != nil || len(blocks) == 0 {
		fmt.Println("No blocks found.")
	} else {
		for _, block := range blocks {
			fmt.Printf("\n--- Block #%d ---\n", block.Index)
			fmt.Printf("Timestamp : %s\n", block.Timestamp)
			fmt.Printf("Hash      : %s\n", block.Hash)
			fmt.Printf("PrevHash  : %s\n", block.PrevHash)
			fmt.Println("Transactions:")
			for _, tx := range block.Transactions {
				printTransaction(tx)
			}
		}
	}

	// --- Load and display election state ---
	fmt.Println("\n========== ELECTION STATE ==========")
	election, err := contracts.LoadElection()
	if err != nil {
		fmt.Println("Error loading election.json:", err)
		return
	}

	// List all candidates with full details
	fmt.Println("\n--- CANDIDATES ---")
	if len(election.Candidates) == 0 {
		fmt.Println("No candidates registered.")
	} else {
		for id, candidate := range election.Candidates {
			fmt.Printf("ID: %s\n", id)
			fmt.Printf("  Name : %s\n", candidate.Name)
			fmt.Printf("  Bio  : %s\n", candidate.Bio)
			fmt.Printf("  Votes: %d\n", candidate.Votes)
			fmt.Println()
		}
	}

	// List all voters who have voted
	fmt.Println("--- VOTERS WHO HAVE VOTED ---")
	if len(election.Voters) == 0 {
		fmt.Println("No votes cast yet.")
	} else {
		for voterID := range election.Voters {
			fmt.Println(" -", voterID)
		}
	}
}

// Helper to print a transaction clearly
func printTransaction(tx blockchain.Transaction) {
	switch {
	case tx.Payload == "VOTE":
		fmt.Printf("  [VOTE]     %s voted for %s (txID: %s)\n", tx.Sender, tx.Receiver, tx.ID)
	case strings.HasPrefix(tx.Payload, "ADD_CANDIDATE:"):
		parts := strings.SplitN(tx.Payload, ":", 3)
		if len(parts) == 3 {
			fmt.Printf("  [ADD]      Admin added candidate '%s' (ID: %s) — Bio: %s\n", parts[1], tx.Receiver, parts[2])
		}
	case strings.HasPrefix(tx.Payload, "UPDATE_CANDIDATE:"):
		parts := strings.SplitN(tx.Payload, ":", 3)
		if len(parts) == 3 {
			fmt.Printf("  [UPDATE]   Admin updated candidate '%s' (ID: %s) — New Bio: %s\n", parts[1], tx.Receiver, parts[2])
		}
	case tx.Payload == "REMOVE_CANDIDATE":
		fmt.Printf("  [REMOVE]   Admin removed candidate ID: %s\n", tx.Receiver)
	default:
		fmt.Printf("  [UNKNOWN]  txID: %s | Sender: %s | Receiver: %s | Payload: %s\n",
			tx.ID, tx.Sender, tx.Receiver, tx.Payload)
	}
}
