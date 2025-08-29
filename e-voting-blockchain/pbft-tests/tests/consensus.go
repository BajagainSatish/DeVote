package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// BlockchainState represents the state of a node's blockchain
type BlockchainState struct {
	NodeID      string   `json:"node_id"`
	BlockHashes []string `json:"block_hashes"`
	Height      int      `json:"height"`
	LastHash    string   `json:"last_hash"`
}

// ConsensusTestResult represents the result of consensus testing
type ConsensusTestResult struct {
	TestName        string            `json:"test_name"`
	Success         bool              `json:"success"`
	NodesInSync     int               `json:"nodes_in_sync"`
	TotalNodes      int               `json:"total_nodes"`
	BlockchainState []BlockchainState `json:"blockchain_states"`
	Message         string            `json:"message"`
}

// TestPBFTConsensus demonstrates PBFT consensus by submitting votes and verifying synchronization
func TestPBFTConsensus() ConsensusTestResult {
	nodes := []string{
		"http://localhost:8081",
		"http://localhost:8082",
		"http://localhost:8083",
		"http://localhost:8084",
	}

	fmt.Println("\n=== PBFT CONSENSUS TEST ===")

	// Step 1: Get initial blockchain state
	fmt.Println("Step 1: Recording initial blockchain state...")
	// initialStates := getBlockchainStates(nodes)

	// Step 2: Submit a vote to node 1 (primary)
	fmt.Println("Step 2: Submitting vote to primary node...")
	vote := map[string]interface{}{
		"voter_id":    "test_voter_consensus",
		"candidate":   "candidate_consensus",
		"timestamp":   time.Now().Unix(),
		"election_id": "test_election_consensus",
	}

	voteJSON, _ := json.Marshal(vote)
	resp, err := http.Post(nodes[0]+"/vote", "application/json", bytes.NewBuffer(voteJSON))
	if err != nil {
		return ConsensusTestResult{
			TestName: "PBFT Consensus",
			Success:  false,
			Message:  fmt.Sprintf("Failed to submit vote: %v", err),
		}
	}
	resp.Body.Close()

	fmt.Println("Vote submitted successfully!")

	// Step 3: Wait for consensus to complete
	fmt.Println("Step 3: Waiting for PBFT consensus to complete...")
	time.Sleep(5 * time.Second)

	// Step 4: Get final blockchain state
	fmt.Println("Step 4: Recording final blockchain state...")
	finalStates := getBlockchainStates(nodes)

	// Step 5: Verify all nodes have synchronized
	fmt.Println("Step 5: Verifying blockchain synchronization...")
	syncResult := verifyBlockchainSync(finalStates)

	return ConsensusTestResult{
		TestName:        "PBFT Consensus",
		Success:         syncResult.Success,
		NodesInSync:     syncResult.NodesInSync,
		TotalNodes:      len(nodes),
		BlockchainState: finalStates,
		Message:         syncResult.Message,
	}
}

// getBlockchainStates queries all nodes for their current blockchain state
func getBlockchainStates(nodes []string) []BlockchainState {
	var states []BlockchainState

	for i, nodeURL := range nodes {
		nodeID := fmt.Sprintf("node%d", i+1)

		resp, err := http.Get(nodeURL + "/blockchain/state")
		if err != nil {
			log.Printf("Failed to get state from %s: %v", nodeURL, err)
			states = append(states, BlockchainState{
				NodeID: nodeID,
				Height: -1, // Indicates error
			})
			continue
		}
		defer resp.Body.Close()

		var stateInfo map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&stateInfo); err != nil {
			log.Printf("Failed to decode state from %s: %v", nodeURL, err)
			continue
		}

		// Extract blockchain information
		height := int(stateInfo["height"].(float64))
		lastHash := stateInfo["last_hash"].(string)

		// Get block hashes
		var blockHashes []string
		if hashes, ok := stateInfo["block_hashes"].([]interface{}); ok {
			for _, hash := range hashes {
				blockHashes = append(blockHashes, hash.(string))
			}
		}

		states = append(states, BlockchainState{
			NodeID:      nodeID,
			BlockHashes: blockHashes,
			Height:      height,
			LastHash:    lastHash,
		})

		fmt.Printf("  %s: Height=%d, LastHash=%s\n",
			nodeID, height, lastHash[:16]+"...")
	}

	return states
}

// verifyBlockchainSync checks if all nodes have identical blockchain states
func verifyBlockchainSync(states []BlockchainState) ConsensusTestResult {
	if len(states) == 0 {
		return ConsensusTestResult{
			Success: false,
			Message: "No blockchain states to compare",
		}
	}

	// Use first valid state as reference
	var referenceState *BlockchainState
	for _, state := range states {
		if state.Height >= 0 {
			referenceState = &state
			break
		}
	}

	if referenceState == nil {
		return ConsensusTestResult{
			Success: false,
			Message: "No valid blockchain states found",
		}
	}

	nodesInSync := 0
	var mismatchDetails []string

	for _, state := range states {
		if state.Height < 0 {
			mismatchDetails = append(mismatchDetails,
				fmt.Sprintf("%s: Connection failed", state.NodeID))
			continue
		}

		if state.Height != referenceState.Height {
			mismatchDetails = append(mismatchDetails,
				fmt.Sprintf("%s: Height mismatch (%d vs %d)",
					state.NodeID, state.Height, referenceState.Height))
			continue
		}

		if state.LastHash != referenceState.LastHash {
			mismatchDetails = append(mismatchDetails,
				fmt.Sprintf("%s: Last hash mismatch", state.NodeID))
			continue
		}

		// Check all block hashes match
		if len(state.BlockHashes) != len(referenceState.BlockHashes) {
			mismatchDetails = append(mismatchDetails,
				fmt.Sprintf("%s: Block count mismatch", state.NodeID))
			continue
		}

		hashesMatch := true
		for i, hash := range state.BlockHashes {
			if hash != referenceState.BlockHashes[i] {
				hashesMatch = false
				break
			}
		}

		if !hashesMatch {
			mismatchDetails = append(mismatchDetails,
				fmt.Sprintf("%s: Block hashes mismatch", state.NodeID))
			continue
		}

		nodesInSync++
	}

	success := nodesInSync == len(states)
	message := fmt.Sprintf("%d/%d nodes synchronized", nodesInSync, len(states))

	if !success {
		message += "\nMismatches: " + fmt.Sprintf("%v", mismatchDetails)
	}

	return ConsensusTestResult{
		Success:     success,
		NodesInSync: nodesInSync,
		Message:     message,
	}
}

// RunConsensusTest runs the full PBFT consensus test
func RunConsensusTest() {
	result := TestPBFTConsensus()

	fmt.Printf("\n=== CONSENSUS TEST RESULT ===\n")
	fmt.Printf("Test: %s\n", result.TestName)
	fmt.Printf("Success: %v\n", result.Success)
	fmt.Printf("Nodes in Sync: %d/%d\n", result.NodesInSync, result.TotalNodes)
	fmt.Printf("Message: %s\n", result.Message)

	fmt.Println("\n--- Blockchain States ---")
	for _, state := range result.BlockchainState {
		fmt.Printf("Node %s -> Height: %d, LastHash: %s\n",
			state.NodeID, state.Height, state.LastHash)
	}
}
