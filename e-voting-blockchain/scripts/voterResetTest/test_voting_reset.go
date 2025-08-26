package main

import (
	"fmt"
	"log"
	"time"

	"e-voting-blockchain/contracts"
)

func main() {
	fmt.Println("Testing voting reset functionality...")

	// Create a new election
	election := contracts.NewElection()

	// Add some test data
	election.AddUser("user1", "John Doe", "john@example.com", "", "")
	election.AddUser("user2", "Jane Smith", "jane@example.com", "", "")
	election.AddCandidate("cand1", "Alice Johnson", "Experienced leader", "", 45, "")
	election.AddCandidate("cand2", "Bob Wilson", "Fresh perspective", "", 38, "")

	// Start first election
	fmt.Println("\n=== Starting First Election ===")
	err := election.StartElection("First Election Test", 1*time.Hour)
	if err != nil {
		log.Fatal("Failed to start election:", err)
	}

	// Simulate some votes
	fmt.Println("Casting votes...")
	election.Vote("user1", "cand1")
	election.Vote("user2", "cand2")

	// Check results
	stats := election.GetStatistics()
	fmt.Printf("Total votes after first election: %v\n", stats["totalVotes"])
	fmt.Printf("Voted users: %v\n", stats["votedUsers"])

	// Stop election
	election.StopElection()
	fmt.Println("First election stopped")

	// Start second election - this should reset all voting records
	fmt.Println("\n=== Starting Second Election ===")
	err = election.StartElection("Second Election Test", 2*time.Hour)
	if err != nil {
		log.Fatal("Failed to start second election:", err)
	}

	// Check if voting records were reset
	stats = election.GetStatistics()
	fmt.Printf("Total votes after reset: %v\n", stats["totalVotes"])
	fmt.Printf("Voted users after reset: %v\n", stats["votedUsers"])

	// Try voting again - should work now
	fmt.Println("Attempting to vote again...")
	err = election.Vote("user1", "cand2")
	if err != nil {
		fmt.Printf("Error voting: %v\n", err)
	} else {
		fmt.Println("Vote successful - reset worked!")
	}

	// Final stats
	stats = election.GetStatistics()
	fmt.Printf("Final total votes: %v\n", stats["totalVotes"])
	fmt.Printf("Final voted users: %v\n", stats["votedUsers"])

	fmt.Println("\n=== Test Complete ===")
}
