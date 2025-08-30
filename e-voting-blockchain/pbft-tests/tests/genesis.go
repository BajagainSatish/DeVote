package tests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"
)

// GenesisTestResult represents the result of genesis block verification
type GenesisTestResult struct {
	NodeID      string `json:"node_id"`
	GenesisHash string `json:"genesis_hash"`
	BlockHeight int    `json:"block_height"`
	Success     bool   `json:"success"`
}

// TestCommonGenesisBlock verifies all nodes start with identical genesis blocks
func TestCommonGenesisBlock(t *testing.T) {
	nodes := []string{
		"http://localhost:8081",
		"http://localhost:8082",
		"http://localhost:8083",
		"http://localhost:8084",
	}

	fmt.Println("=== GENESIS BLOCK VERIFICATION TEST ===")

	var results []GenesisTestResult
	genesisHashes := make(map[string]int)

	// Query each node for genesis block info
	for i, nodeURL := range nodes {
		nodeID := fmt.Sprintf("node%d", i+1)

		resp, err := http.Get(nodeURL + "/blockchain/genesis")
		if err != nil {
			t.Errorf("Failed to connect to %s: %v", nodeURL, err)
			results = append(results, GenesisTestResult{
				NodeID:  nodeID,
				Success: false,
			})
			continue
		}
		defer resp.Body.Close()

		var genesisInfo map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&genesisInfo); err != nil {
			t.Errorf("Failed to decode response from %s: %v", nodeURL, err)
			continue
		}

		genesisHash := genesisInfo["hash"].(string)
		blockHeight := int(genesisInfo["height"].(float64))

		results = append(results, GenesisTestResult{
			NodeID:      nodeID,
			GenesisHash: genesisHash,
			BlockHeight: blockHeight,
			Success:     true,
		})

		genesisHashes[genesisHash]++

		fmt.Printf("Node %s: Genesis Hash = %s, Height = %d\n",
			nodeID, genesisHash[:16]+"...", blockHeight)
	}

	// Verify all nodes have the same genesis hash
	if len(genesisHashes) != 1 {
		t.Errorf("FAIL: Nodes have different genesis blocks!")
		for hash, count := range genesisHashes {
			fmt.Printf("  Hash %s: %d nodes\n", hash[:16]+"...", count)
		}
	} else {
		fmt.Println("SUCCESS: All nodes have identical genesis blocks!")
	}

	// Print summary
	fmt.Printf("\nGenesis Block Verification Summary:\n")
	for _, result := range results {
		status := "✓"
		if !result.Success {
			status = "✗"
		}
		fmt.Printf("  %s %s: %s\n", status, result.NodeID, result.GenesisHash[:16]+"...")
	}
}

// RunGenesisTest runs the genesis block verification test
func RunGenesisTest() {
	fmt.Println("Starting Genesis Block Verification Test...")

	// Wait a moment for nodes to be ready
	time.Sleep(2 * time.Second)

	t := &testing.T{}
	TestCommonGenesisBlock(t)
}

// VerifyGenesisBlocks checks that all nodes have the same genesis block
func VerifyGenesisBlocks() {
	fmt.Println("=== GENESIS BLOCK VERIFICATION ===")

	nodes := []string{
		"http://localhost:8081",
		"http://localhost:8082",
		"http://localhost:8083",
		"http://localhost:8084",
	}

	var genesisBlocks []map[string]interface{}

	// Get genesis block from each node
	for i, nodeURL := range nodes {
		nodeID := fmt.Sprintf("node%d", i+1)

		resp, err := http.Get(nodeURL + "/blockchain/genesis")
		if err != nil {
			fmt.Printf("❌ Failed to get genesis from %s: %v\n", nodeID, err)
			continue
		}
		defer resp.Body.Close()

		var genesis map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&genesis); err != nil {
			fmt.Printf("❌ Failed to decode genesis from %s: %v\n", nodeID, err)
			continue
		}

		genesisBlocks = append(genesisBlocks, genesis)

		hash := genesis["hash"].(string)
		fmt.Printf("✅ %s genesis: %s\n", nodeID, hash[:16]+"...")
	}

	// Verify all genesis blocks are identical
	if len(genesisBlocks) < 2 {
		fmt.Println("❌ Not enough genesis blocks to compare")
		return
	}

	referenceHash := genesisBlocks[0]["hash"].(string)
	allMatch := true

	for i := 1; i < len(genesisBlocks); i++ {
		if genesisBlocks[i]["hash"].(string) != referenceHash {
			allMatch = false
			break
		}
	}

	if allMatch {
		fmt.Printf("All %d nodes have identical genesis blocks\n", len(genesisBlocks))
	} else {
		fmt.Printf("Genesis blocks do not match across all nodes\n")
	}
}
