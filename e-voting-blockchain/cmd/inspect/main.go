package main

import (
	"e-voting-blockchain/blockchain"
	"e-voting-blockchain/contracts"
	"fmt"
	"strings"
	"time"
)

func main() {
	fmt.Println("🔍 E-VOTING BLOCKCHAIN INSPECTOR")
	// fmt.Println("=" * 50)

	// Initialize and load blockchain
	blockchain.InitDB()
	blocks, err := blockchain.LoadBlocks()
	if err != nil || len(blocks) == 0 {
		fmt.Println("No blockchain data found.")
		fmt.Println("Run the server first to initialize the blockchain.")
		return
	}

	// Create blockchain instance for integrity checking
	chain := blockchain.NewBlockchain()

	// Display blockchain overview
	fmt.Printf("\n📊 BLOCKCHAIN OVERVIEW\n")
	fmt.Printf("   Total Blocks: %d\n", len(blocks))

	totalTransactions := 0
	for _, block := range blocks {
		totalTransactions += len(block.Transactions)
	}
	fmt.Printf("   Total Transactions: %d\n", totalTransactions)

	if len(blocks) > 0 {
		lastBlock := blocks[len(blocks)-1]
		fmt.Printf("   Latest Block: #%d (%s)\n", lastBlock.Index, lastBlock.GetFormattedTimestamp())
	}

	// Blockchain integrity check
	fmt.Printf("\n🔒 BLOCKCHAIN INTEGRITY CHECK\n")
	report := chain.GetIntegrityReport()

	if report.IsValid {
		fmt.Printf("   Blockchain is VALID\n")
		fmt.Printf("   All %d blocks verified successfully\n", report.ValidBlocks)
	} else {
		fmt.Printf("   Blockchain has INTEGRITY ISSUES\n")
		fmt.Printf("   Valid blocks: %d/%d\n", report.ValidBlocks, report.TotalBlocks)
		fmt.Printf("   Invalid blocks: %d\n", len(report.InvalidBlocks))

		for _, invalid := range report.InvalidBlocks {
			fmt.Printf("      - Block #%d: %s\n", invalid.Index, invalid.Reason)
			if invalid.ExpectedHash != invalid.ActualHash {
				fmt.Printf("        Expected: %s\n", invalid.ExpectedHash[:16]+"...")
				fmt.Printf("        Actual:   %s\n", invalid.ActualHash[:16]+"...")
			}
		}
	}

	// Display detailed block information
	fmt.Printf("\n📦 BLOCK DETAILS\n")
	for _, block := range blocks {
		fmt.Printf("\n   --- Block #%d ---\n", block.Index)
		fmt.Printf("   Timestamp: %s\n", block.GetFormattedTimestamp())
		fmt.Printf("   Hash:      %s\n", block.Hash[:32]+"...")
		if block.PrevHash != "" {
			fmt.Printf("   Prev Hash: %s\n", block.PrevHash[:32]+"...")
		} else {
			fmt.Printf("   Prev Hash: Genesis Block\n")
		}
		fmt.Printf("   Transactions: %d\n", len(block.Transactions))

		// Display transactions in this block
		for i, tx := range block.Transactions {
			fmt.Printf("      %d. %s\n", i+1, getTransactionSummary(tx))
		}
	}

	// Transaction type statistics
	fmt.Printf("\n📈 TRANSACTION STATISTICS\n")
	txStats := make(map[blockchain.TransactionType]int)
	allTransactions := chain.GetAllTransactions()

	for _, tx := range allTransactions {
		txStats[tx.Data.Type]++
	}

	for txType, count := range txStats {
		fmt.Printf("   %s: %d\n", strings.Replace(string(txType), "_", " ", -1), count)
	}

	// Recent activity
	fmt.Printf("\n⏰ RECENT ACTIVITY (Last 10 transactions)\n")
	recentTx := chain.GetRecentTransactions(10)

	if len(recentTx) == 0 {
		fmt.Printf("   No transactions found.\n")
	} else {
		for i, tx := range recentTx {
			fmt.Printf("   %d. [%s] %s (%s)\n",
				len(recentTx)-i,
				tx.Data.Type,
				getTransactionSummary(tx),
				tx.GetFormattedTimestamp())
		}
	}

	// Load and display election state
	fmt.Printf("\n🗳️  ELECTION STATE\n")
	election, err := contracts.LoadElection()
	if err != nil {
		fmt.Printf("Error loading election data: %v\n", err)
	} else {
		// fmt.Printf("   Status: %s\n", getElectionStatus(election))
		fmt.Printf("   Candidates: %d\n", len(election.Candidates))
		fmt.Printf("   Total Votes Cast: %d\n", len(election.Voters))

		if len(election.Candidates) > 0 {
			fmt.Printf("\n   📋 CANDIDATES:\n")
			for id, candidate := range election.Candidates {
				fmt.Printf("      • %s (ID: %s) - %d votes\n",
					candidate.Name, id, candidate.Votes)
			}
		}

		if len(election.Voters) > 0 {
			fmt.Printf("\n   👥 VOTERS WHO HAVE VOTED:\n")
			count := 0
			for voterID := range election.Voters {
				if count < 10 { // Show first 10
					fmt.Printf("      • %s\n", voterID)
					count++
				} else if count == 10 {
					fmt.Printf("      ... and %d more\n", len(election.Voters)-10)
					break
				}
			}
		}
	}

	// System health summary
	fmt.Printf("\n🏥 SYSTEM HEALTH SUMMARY\n")
	fmt.Printf("   Blockchain Integrity: %s\n", getHealthStatus(report.IsValid))
	fmt.Printf("   Data Consistency: %s\n", getHealthStatus(err == nil))
	fmt.Printf("   Last Activity: %s\n", getLastActivityTime(allTransactions))

	// fmt.Printf("\n" + "="*50)
	fmt.Printf("\n✅ Inspection completed at %s\n", time.Now().Format("2006-01-02 15:04:05"))
}

func getTransactionSummary(tx blockchain.Transaction) string {
	switch tx.Data.Type {
	case blockchain.TxTypeVote:
		return fmt.Sprintf("%s voted for %s", tx.Data.Actor, tx.Data.Target)
	case blockchain.TxTypeVoterRegister:
		return fmt.Sprintf("Voter registered: %s", tx.Data.Target)
	case blockchain.TxTypeAddCandidate:
		return fmt.Sprintf("Admin added candidate: %s", tx.Data.Target)
	case blockchain.TxTypeUpdateCandidate:
		return fmt.Sprintf("Admin updated candidate: %s", tx.Data.Target)
	case blockchain.TxTypeDeleteCandidate:
		return fmt.Sprintf("Admin deleted candidate: %s", tx.Data.Target)
	case blockchain.TxTypeAddParty:
		return fmt.Sprintf("Admin added party: %s", tx.Data.Target)
	case blockchain.TxTypeUpdateParty:
		return fmt.Sprintf("Admin updated party: %s", tx.Data.Target)
	case blockchain.TxTypeDeleteParty:
		return fmt.Sprintf("Admin deleted party: %s", tx.Data.Target)
	case blockchain.TxTypeStartElection:
		return fmt.Sprintf("Admin started election: %s", tx.Data.Action)
	case blockchain.TxTypeStopElection:
		return "Admin stopped election"
	case blockchain.TxTypeDeleteVoter:
		return fmt.Sprintf("Admin deleted voter: %s", tx.Data.Target)
	default:
		return tx.Data.Action
	}
}

// func getElectionStatus(election contracts.Election) string {
// 	if election.IsActive {
// 		return "🟢 ACTIVE"
// 	}
// 	return "🔴 INACTIVE"
// }

func getHealthStatus(isHealthy bool) string {
	if isHealthy {
		return "HEALTHY"
	}
	return "ISSUES DETECTED"
}

func getLastActivityTime(transactions []blockchain.Transaction) string {
	if len(transactions) == 0 {
		return "No activity"
	}

	lastTx := transactions[len(transactions)-1]
	duration := time.Since(lastTx.Data.Timestamp)

	if duration < time.Minute {
		return "Just now"
	} else if duration < time.Hour {
		return fmt.Sprintf("%d minutes ago", int(duration.Minutes()))
	} else if duration < 24*time.Hour {
		return fmt.Sprintf("%d hours ago", int(duration.Hours()))
	} else {
		return fmt.Sprintf("%d days ago", int(duration.Hours()/24))
	}
}
