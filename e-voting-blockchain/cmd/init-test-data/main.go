// cmd/init-test-data/main.go
// Script to initialize test data with proper timestamps
package main

import (
	"e-voting-blockchain/blockchain"
	"e-voting-blockchain/contracts"
	"fmt"
	"log"
	"time"
)

func main() {
	fmt.Println("🚀 Initializing test data with proper timestamps...")

	// Initialize blockchain
	chain := blockchain.NewBlockchain()

	// Create some test transactions with proper timestamps
	fmt.Println("📝 Creating test transactions...")

	// Simulate admin login
	tx1 := blockchain.NewTransaction(
		blockchain.TxTypeAdminLogin,
		"admin@devote.com",
		"system",
		"Admin login successful",
		map[string]interface{}{
			"loginTime": time.Now(),
			"userAgent": "Test Browser",
		},
		"127.0.0.1",
	)

	// Wait a bit to ensure different timestamps
	time.Sleep(1 * time.Second)

	// Simulate adding a party
	tx2 := blockchain.NewTransaction(
		blockchain.TxTypeAddParty,
		"admin",
		"PARTY001",
		"Added party",
		map[string]interface{}{
			"name":        "Democratic Party",
			"description": "A test political party",
			"color":       "#0066CC",
		},
		"127.0.0.1",
	)

	time.Sleep(1 * time.Second)

	// Simulate adding a candidate
	tx3 := blockchain.NewTransaction(
		blockchain.TxTypeAddCandidate,
		"admin",
		"CAND001",
		"Added candidate",
		map[string]interface{}{
			"name":    "John Doe",
			"bio":     "Experienced politician",
			"partyId": "PARTY001",
			"age":     45,
		},
		"127.0.0.1",
	)

	time.Sleep(1 * time.Second)

	// Simulate voter registration
	tx4 := blockchain.NewTransaction(
		blockchain.TxTypeVoterRegister,
		"system",
		"voter001",
		"Voter registered",
		map[string]interface{}{
			"email": "voter1@example.com",
		},
		"192.168.1.100",
	)

	time.Sleep(1 * time.Second)

	// Simulate starting election
	tx5 := blockchain.NewTransaction(
		blockchain.TxTypeStartElection,
		"admin",
		"election",
		"Started election",
		map[string]interface{}{
			"description":   "Test Election 2024",
			"durationHours": 24,
			"endTime":       time.Now().Add(24 * time.Hour),
		},
		"127.0.0.1",
	)

	time.Sleep(1 * time.Second)

	// Simulate a vote
	tx6 := blockchain.NewTransaction(
		blockchain.TxTypeVote,
		"voter001",
		"CAND001",
		"Cast vote",
		map[string]interface{}{
			"candidateId": "CAND001",
			"voterID":     "voter001",
		},
		"192.168.1.100",
	)

	time.Sleep(1 * time.Second)

	// Simulate user login
	tx7 := blockchain.NewTransaction(
		blockchain.TxTypeUserLogin,
		"voter001",
		"system",
		"User login successful",
		map[string]interface{}{
			"loginTime": time.Now(),
		},
		"192.168.1.100",
	)

	time.Sleep(1 * time.Second)

	// Simulate adding another party
	tx8 := blockchain.NewTransaction(
		blockchain.TxTypeAddParty,
		"admin",
		"PARTY002",
		"Added party",
		map[string]interface{}{
			"name":        "Republican Party",
			"description": "Another test political party",
			"color":       "#CC0000",
		},
		"127.0.0.1",
	)

	// Add transactions to blockchain in separate blocks
	fmt.Println("⛓️  Adding transactions to blockchain...")
	chain.AddTransaction(tx1)
	time.Sleep(500 * time.Millisecond)

	chain.AddTransaction(tx2)
	time.Sleep(500 * time.Millisecond)

	chain.AddTransaction(tx3)
	time.Sleep(500 * time.Millisecond)

	chain.AddTransaction(tx4)
	time.Sleep(500 * time.Millisecond)

	chain.AddTransaction(tx5)
	time.Sleep(500 * time.Millisecond)

	chain.AddTransaction(tx6)
	time.Sleep(500 * time.Millisecond)

	chain.AddTransaction(tx7)
	time.Sleep(500 * time.Millisecond)

	chain.AddTransaction(tx8)

	// Initialize election data
	fmt.Println("🗳️  Initializing election data...")
	election := contracts.NewElection()

	// Add test parties
	election.AddParty("PARTY001", "Democratic Party", "A test political party", "#0066CC")
	election.AddParty("PARTY002", "Republican Party", "Another test political party", "#CC0000")

	// Add test candidates
	election.AddCandidate("CAND001", "John Doe", "Experienced politician", "PARTY001", 45, "")
	election.AddCandidate("CAND002", "Jane Smith", "Fresh perspective", "PARTY002", 38, "")

	// Start election
	election.StartElection("Test Election 2024", 24*time.Hour)

	// Save election
	if err := election.SaveElection(); err != nil {
		log.Printf("Failed to save election: %v", err)
	}

	// Display summary
	fmt.Println("\n📊 TEST DATA SUMMARY")
	// fmt.Println("=" * 30)
	fmt.Printf("✅ Created %d transactions\n", 8)
	// fmt.Printf("✅ Created %d blocks\n", len(chain.GetBlocks()))
	fmt.Printf("✅ Added %d parties\n", 2)
	fmt.Printf("✅ Added %d candidates\n", 2)
	fmt.Printf("✅ Started election: %s\n", "Test Election 2024")

	fmt.Println("\n🎯 Test data initialized successfully!")
	fmt.Println("💡 Run 'go run cmd/inspect/main.go' to view the blockchain and election state.")
	fmt.Println("🌐 Start the web server to see the data in the blockchain explorer.")
}
