package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type ByzantineTestResult struct {
	TestName        string                 `json:"test_name"`
	Success         bool                   `json:"success"`
	NodesStatus     map[string]interface{} `json:"nodes_status"`
	ConsensusPassed bool                   `json:"consensus_passed"`
	Message         string                 `json:"message"`
}

func RunByzantineTest() {
	fmt.Println("=== BYZANTINE FAULT TOLERANCE TEST ===")

	// Test 1: All nodes honest (should pass)
	fmt.Println("\n1. Testing with all honest nodes...")
	result1 := testAllHonest()
	printTestResult(result1)

	// Test 2: One malicious node (should still pass - 3 honest vs 1 malicious)
	fmt.Println("\n2. Testing with 1 malicious node...")
	result2 := testOneMalicious()
	printTestResult(result2)

	// Test 3: Two malicious nodes (should fail - 2 honest vs 2 malicious)
	fmt.Println("\n3. Testing with 2 malicious nodes...")
	result3 := testTwoMalicious()
	printTestResult(result3)

	// Reset all nodes to honest
	fmt.Println("\n4. Resetting all nodes to honest behavior...")
	resetAllNodes()
}

func testAllHonest() ByzantineTestResult {
	// Set all nodes to honest
	setNodeBehavior("node1", "honest", 0.0)
	setNodeBehavior("node2", "honest", 0.0)
	setNodeBehavior("node3", "honest", 0.0)
	setNodeBehavior("node4", "honest", 0.0)

	time.Sleep(1 * time.Second)

	// Submit a vote
	submitVote("node1", "alice", "candidate_honest")

	// Wait for consensus
	time.Sleep(3 * time.Second)

	// Check if all nodes are synchronized
	synchronized, status := checkNodeSynchronization()

	return ByzantineTestResult{
		TestName:        "All Honest Nodes",
		Success:         synchronized,
		NodesStatus:     status,
		ConsensusPassed: synchronized,
		Message:         fmt.Sprintf("All honest nodes should reach consensus: %v", synchronized),
	}
}

func testOneMalicious() ByzantineTestResult {
	// Set node4 to malicious (25% malicious rate)
	setNodeBehavior("node1", "honest", 0.0)
	setNodeBehavior("node2", "honest", 0.0)
	setNodeBehavior("node3", "honest", 0.0)
	setNodeBehavior("node4", "malicious", 0.5) // 50% chance to reject blocks

	time.Sleep(1 * time.Second)

	// Submit a vote
	submitVote("node1", "bob", "candidate_one_malicious")

	// Wait for consensus
	time.Sleep(3 * time.Second)

	// Check if majority (3 honest) nodes are synchronized
	synchronized, status := checkMajoritySynchronization()

	return ByzantineTestResult{
		TestName:        "One Malicious Node",
		Success:         synchronized,
		NodesStatus:     status,
		ConsensusPassed: synchronized,
		Message:         fmt.Sprintf("3 honest vs 1 malicious should reach consensus: %v", synchronized),
	}
}

func testTwoMalicious() ByzantineTestResult {
	// Set node3 and node4 to malicious
	setNodeBehavior("node1", "honest", 0.0)
	setNodeBehavior("node2", "honest", 0.0)
	setNodeBehavior("node3", "malicious", 0.8) // 80% chance to reject blocks
	setNodeBehavior("node4", "malicious", 0.8) // 80% chance to reject blocks

	time.Sleep(1 * time.Second)

	// Submit a vote
	submitVote("node1", "charlie", "candidate_two_malicious")

	// Wait for consensus
	time.Sleep(3 * time.Second)

	// Check synchronization (should fail with 2 honest vs 2 malicious)
	synchronized, status := checkNodeSynchronization()

	return ByzantineTestResult{
		TestName:        "Two Malicious Nodes",
		Success:         !synchronized, // Success means consensus FAILED as expected
		NodesStatus:     status,
		ConsensusPassed: synchronized,
		Message:         fmt.Sprintf("2 honest vs 2 malicious should NOT reach consensus: %v", !synchronized),
	}
}

func submitVote(nodeID, voterID, candidate string) error {
	port := getNodePort(nodeID)
	url := fmt.Sprintf("http://localhost:%d/vote", port)

	vote := map[string]interface{}{
		"voter_id":     voterID,
		"candidate_id": candidate,
	}

	jsonData, err := json.Marshal(vote)
	if err != nil {
		return fmt.Errorf("failed to marshal vote: %v", err)
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to submit vote to %s: %v", nodeID, err)
	}
	defer resp.Body.Close()

	fmt.Printf("Vote submitted: %s -> %s (via %s)\n", voterID, candidate, nodeID)
	return nil
}

func checkNodeSynchronization() (bool, map[string]interface{}) {
	status := make(map[string]interface{})

	// Get blockchain state from all nodes
	for i := 1; i <= 4; i++ {
		nodeID := fmt.Sprintf("node%d", i)
		port := getNodePort(nodeID)

		resp, err := http.Get(fmt.Sprintf("http://localhost:%d/blockchain/state", port))
		if err != nil {
			status[nodeID] = map[string]interface{}{"error": err.Error()}
			continue
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		var nodeStatus map[string]interface{}
		json.Unmarshal(body, &nodeStatus)
		status[nodeID] = nodeStatus
	}

	// Check if all nodes have the same blockchain state
	heights := make(map[interface{}]int)
	hashes := make(map[interface{}]int)

	for _, nodeStatus := range status {
		if nodeData, ok := nodeStatus.(map[string]interface{}); ok {
			if height, exists := nodeData["height"]; exists {
				heights[height]++
			}
			if lastHash, exists := nodeData["last_hash"]; exists {
				hashes[lastHash]++
			}
		}
	}

	// All nodes should have the same height and hash
	for _, count := range heights {
		if count != 4 {
			return false, status
		}
	}

	for _, count := range hashes {
		if count != 4 {
			return false, status
		}
	}

	return true, status
}

func getNodePort(nodeID string) int {
	// Map node IDs to their respective ports
	portMap := map[string]int{
		"node1": 8081,
		"node2": 8082,
		"node3": 8083,
		"node4": 8084,
	}

	if port, exists := portMap[nodeID]; exists {
		return port
	}

	// Default fallback (shouldn't happen with valid node IDs)
	return 8081
}

func setNodeBehavior(nodeID, behavior string, maliciousRate float64) {
	port := getNodePort(nodeID)
	url := fmt.Sprintf("http://localhost:%d/pbft/behavior", port)

	payload := map[string]interface{}{
		"behavior":       behavior,
		"malicious_rate": maliciousRate,
	}

	jsonData, _ := json.Marshal(payload)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Failed to set behavior for %s: %v\n", nodeID, err)
		return
	}
	defer resp.Body.Close()

	fmt.Printf("Set %s to %s behavior (malicious rate: %.1f)\n", nodeID, behavior, maliciousRate)
}

func checkMajoritySynchronization() (bool, map[string]interface{}) {
	status := make(map[string]interface{})

	// Get blockchain state from all nodes
	for i := 1; i <= 4; i++ {
		nodeID := fmt.Sprintf("node%d", i)
		port := getNodePort(nodeID)

		resp, err := http.Get(fmt.Sprintf("http://localhost:%d/blockchain/state", port))
		if err != nil {
			status[nodeID] = map[string]interface{}{"error": err.Error()}
			continue
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		var nodeStatus map[string]interface{}
		json.Unmarshal(body, &nodeStatus)
		status[nodeID] = nodeStatus
	}

	// Check if at least 3 nodes (majority) are synchronized
	heights := make(map[interface{}]int)
	hashes := make(map[interface{}]int)

	for _, nodeStatus := range status {
		if nodeData, ok := nodeStatus.(map[string]interface{}); ok {
			if height, exists := nodeData["height"]; exists {
				heights[height]++
			}
			if lastHash, exists := nodeData["last_hash"]; exists {
				hashes[lastHash]++
			}
		}
	}

	// Find the most common height and hash
	maxHeightCount := 0
	maxHashCount := 0

	for _, count := range heights {
		if count > maxHeightCount {
			maxHeightCount = count
		}
	}

	for _, count := range hashes {
		if count > maxHashCount {
			maxHashCount = count
		}
	}

	// Majority consensus achieved if at least 3 nodes agree
	return maxHeightCount >= 3 && maxHashCount >= 3, status
}

func resetAllNodes() {
	for i := 1; i <= 4; i++ {
		nodeID := fmt.Sprintf("node%d", i)
		setNodeBehavior(nodeID, "honest", 0.0)
	}
	fmt.Println("All nodes reset to honest behavior")
}

func printTestResult(result ByzantineTestResult) {
	status := "PASS"
	if !result.Success {
		status = "FAIL"
	}

	fmt.Printf("Test: %s - %s\n", result.TestName, status)
	fmt.Printf("Message: %s\n", result.Message)
	fmt.Printf("Consensus Passed: %v\n", result.ConsensusPassed)

	for nodeID, nodeStatus := range result.NodesStatus {
		if nodeData, ok := nodeStatus.(map[string]interface{}); ok {
			height := nodeData["height"]
			lastHash := ""
			if hash, exists := nodeData["last_hash"]; exists && hash != nil {
				lastHash = hash.(string)
				if len(lastHash) > 8 {
					lastHash = lastHash[:8]
				}
			}
			fmt.Printf("  %s: height=%v, hash=%s\n", nodeID, height, lastHash)
		}
	}
}
