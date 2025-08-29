//internal/pbft/node.go

package pbft

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"
)

// NodeBehavior represents the behavior of a PBFT node in Byzantine fault tolerance scenarios
type NodeBehavior int

const (
	BehaviorHonest NodeBehavior = iota
	BehaviorMalicious
	BehaviorCrash
)

// NodeState represents the current state of a PBFT node
type NodeState int

const (
	StateIdle NodeState = iota
	StatePrePrepare
	StatePrepare
	StateCommit
	StateCommitted
)

// PBFTNode represents a single node in the PBFT network
type PBFTNode struct {
	ID           string           `json:"id"`
	Address      string           `json:"address"`
	Port         int              `json:"port"`
	State        NodeState        `json:"state"`
	View         int              `json:"view"`
	SequenceNum  int              `json:"sequence_num"`
	IsPrimary    bool             `json:"is_primary"`
	Peers        map[string]*Peer `json:"peers"`
	MessageLog   []PBFTMessage    `json:"message_log"`
	PrepareCount map[string]int   `json:"prepare_count"`
	CommitCount  map[string]int   `json:"commit_count"`
	mutex        sync.RWMutex

	// Byzantine fault tolerance fields
	Behavior      NodeBehavior `json:"behavior"`
	MaliciousRate float64      `json:"malicious_rate"` // Probability of malicious behavior (0.0-1.0)

	// Blockchain integration
	OnBlockCommitted func(block interface{}) error
}

// Peer represents another node in the network
type Peer struct {
	ID      string `json:"id"`
	Address string `json:"address"`
	Port    int    `json:"port"`
	Active  bool   `json:"active"`
}

// PBFTMessage represents a message in the PBFT protocol
type PBFTMessage struct {
	Type        MessageType `json:"type"`
	View        int         `json:"view"`
	SequenceNum int         `json:"sequence_num"`
	NodeID      string      `json:"node_id"`
	BlockHash   string      `json:"block_hash"`
	BlockData   string      `json:"block_data"` // JSON serialized block
	Timestamp   time.Time   `json:"timestamp"`
	Signature   string      `json:"signature,omitempty"`
}

type MessageType string

const (
	PrePrepareMsg MessageType = "PRE_PREPARE"
	PrepareMsg    MessageType = "PREPARE"
	CommitMsg     MessageType = "COMMIT"
	ViewChangeMsg MessageType = "VIEW_CHANGE"
)

// NewPBFTNode creates a new PBFT node
func NewPBFTNode(id, address string, port int, peers []Peer) *PBFTNode {
	node := &PBFTNode{
		ID:            id,
		Address:       address,
		Port:          port,
		State:         StateIdle,
		View:          0,
		SequenceNum:   0,
		IsPrimary:     false,
		Peers:         make(map[string]*Peer),
		MessageLog:    make([]PBFTMessage, 0),
		PrepareCount:  make(map[string]int),
		CommitCount:   make(map[string]int),
		Behavior:      BehaviorHonest,
		MaliciousRate: 0.0,
	}

	// Add peers
	for _, peer := range peers {
		node.Peers[peer.ID] = &Peer{
			ID:      peer.ID,
			Address: peer.Address,
			Port:    peer.Port,
			Active:  true,
		}
	}

	// Determine if this node is primary (simple: lowest ID in current view)
	node.updatePrimaryStatus()

	return node
}

// updatePrimaryStatus determines if this node should be primary
func (n *PBFTNode) updatePrimaryStatus() {
	n.mutex.Lock()
	defer n.mutex.Unlock()

	// Simple primary selection: node with lowest ID for current view
	primaryID := n.ID
	for peerID := range n.Peers {
		if peerID < primaryID {
			primaryID = peerID
		}
	}

	n.IsPrimary = (primaryID == n.ID)
	log.Printf("Node %s: Primary status = %v (view %d)", n.ID, n.IsPrimary, n.View)
}

// StartConsensus initiates PBFT consensus for a new block (primary only)
func (n *PBFTNode) StartConsensus(blockData interface{}) error {
	n.mutex.Lock()
	defer n.mutex.Unlock()

	if !n.IsPrimary {
		return fmt.Errorf("only primary can start consensus")
	}

	if n.State != StateIdle {
		return fmt.Errorf("node not in idle state")
	}

	// Serialize block data
	blockJSON, err := json.Marshal(blockData)
	if err != nil {
		return fmt.Errorf("failed to serialize block: %v", err)
	}

	// Generate block hash
	hash := sha256.Sum256(blockJSON)
	blockHash := hex.EncodeToString(hash[:])

	// Create PRE-PREPARE message
	prePrepareMsg := PBFTMessage{
		Type:        PrePrepareMsg,
		View:        n.View,
		SequenceNum: n.SequenceNum,
		NodeID:      n.ID,
		BlockHash:   blockHash,
		BlockData:   string(blockJSON),
		Timestamp:   time.Now(),
	}

	// Log the message
	n.MessageLog = append(n.MessageLog, prePrepareMsg)
	n.State = StatePrePrepare

	log.Printf("Node %s: Starting consensus for block %s (seq: %d)", n.ID, blockHash[:8], n.SequenceNum)

	prepareMsg := PBFTMessage{
		Type:        PrepareMsg,
		View:        n.View,
		SequenceNum: n.SequenceNum,
		NodeID:      n.ID,
		BlockHash:   blockHash,
		Timestamp:   time.Now(),
	}

	// Count primary's own PREPARE
	key := fmt.Sprintf("%d-%s", n.SequenceNum, blockHash)
	n.PrepareCount[key]++

	// Broadcast PRE-PREPARE to all peers
	go n.broadcastMessage(prePrepareMsg)

	go n.broadcastMessage(prepareMsg)

	n.checkPrepareThreshold(key, n.SequenceNum, blockHash)

	return nil
}

// ProcessMessage handles incoming PBFT messages
func (n *PBFTNode) ProcessMessage(msg PBFTMessage) error {
	n.mutex.Lock()
	defer n.mutex.Unlock()

	// Basic validation
	if msg.View != n.View {
		log.Printf("Node %s: Ignoring message from different view %d (current: %d)", n.ID, msg.View, n.View)
		return nil
	}

	// Log the message
	n.MessageLog = append(n.MessageLog, msg)

	switch msg.Type {
	case PrePrepareMsg:
		return n.handlePrePrepare(msg)
	case PrepareMsg:
		return n.handlePrepare(msg)
	case CommitMsg:
		return n.handleCommit(msg)
	default:
		return fmt.Errorf("unknown message type: %s", msg.Type)
	}
}

// handlePrePrepare processes PRE-PREPARE messages (backup nodes only)
func (n *PBFTNode) handlePrePrepare(msg PBFTMessage) error {
	if n.IsPrimary {
		return nil // Primary doesn't process its own PRE-PREPARE
	}

	if n.State != StateIdle {
		log.Printf("Node %s: Ignoring PRE-PREPARE, not in idle state", n.ID)
		return nil
	}

	log.Printf("Node %s: Received PRE-PREPARE for block %s", n.ID, msg.BlockHash[:8])

	if n.Behavior == BehaviorMalicious {
		shouldRefuseParticipation := rand.Float64() < n.MaliciousRate
		if shouldRefuseParticipation {
			log.Printf("Node %s: MALICIOUS behavior - REFUSING to participate in consensus", n.ID)
			return nil // Don't participate at all
		}
	}

	if !n.validateBlock(msg.BlockData, msg.BlockHash) {
		log.Printf("Node %s: Block validation failed, rejecting PRE-PREPARE", n.ID)
		return fmt.Errorf("invalid block")
	}

	// Send PREPARE message
	prepareMsg := PBFTMessage{
		Type:        PrepareMsg,
		View:        n.View,
		SequenceNum: msg.SequenceNum,
		NodeID:      n.ID,
		BlockHash:   msg.BlockHash,
		Timestamp:   time.Now(),
	}

	n.State = StatePrepare
	n.SequenceNum = msg.SequenceNum

	log.Printf("Node %s: Block validated, sending PREPARE", n.ID)

	key := fmt.Sprintf("%d-%s", msg.SequenceNum, msg.BlockHash)
	n.PrepareCount[key]++

	// Broadcast PREPARE to all peers
	go n.broadcastMessage(prepareMsg)

	n.checkPrepareThreshold(key, msg.SequenceNum, msg.BlockHash)

	return nil
}

// handlePrepare processes PREPARE messages
func (n *PBFTNode) handlePrepare(msg PBFTMessage) error {
	if n.State != StatePrePrepare && n.State != StatePrepare {
		return nil
	}

	if n.Behavior == BehaviorMalicious {
		shouldIgnore := rand.Float64() < n.MaliciousRate
		if shouldIgnore {
			log.Printf("Node %s: MALICIOUS behavior - IGNORING PREPARE from %s", n.ID, msg.NodeID)
			return nil
		}
	}

	// Count PREPARE messages for this block
	key := fmt.Sprintf("%d-%s", msg.SequenceNum, msg.BlockHash)
	n.PrepareCount[key]++

	log.Printf("Node %s: Received PREPARE from %s for block %s (count: %d)",
		n.ID, msg.NodeID, msg.BlockHash[:8], n.PrepareCount[key])

	n.checkPrepareThreshold(key, msg.SequenceNum, msg.BlockHash)

	return nil
}

// handleCommit processes COMMIT messages
func (n *PBFTNode) handleCommit(msg PBFTMessage) error {
	if n.State != StateCommit && n.State != StatePrePrepare && n.State != StatePrepare {
		return nil
	}

	if n.Behavior == BehaviorMalicious {
		shouldIgnore := rand.Float64() < n.MaliciousRate
		if shouldIgnore {
			log.Printf("Node %s: MALICIOUS behavior - IGNORING COMMIT from %s", n.ID, msg.NodeID)
			return nil
		}
	}

	// Count COMMIT messages for this block
	key := fmt.Sprintf("%d-%s", msg.SequenceNum, msg.BlockHash)
	n.CommitCount[key]++

	log.Printf("Node %s: Received COMMIT from %s for block %s (count: %d)",
		n.ID, msg.NodeID, msg.BlockHash[:8], n.CommitCount[key])

	n.checkCommitThreshold(key, msg.SequenceNum, msg.BlockHash)

	return nil
}

// checkPrepareThreshold checks if the prepare threshold is reached
func (n *PBFTNode) checkPrepareThreshold(key string, sequenceNum int, blockHash string) {
	// Calculate required PREPARE messages: 2f+1 total nodes, so we need 2f PREPARE messages
	totalNodes := len(n.Peers) + 1 // +1 for self
	f := (totalNodes - 1) / 3      // Maximum faulty nodes
	requiredPrepares := 2 * f      // Need 2f PREPARE messages

	if n.PrepareCount[key] >= requiredPrepares {
		log.Printf("Node %s: Prepare threshold reached (%d/%d), sending COMMIT",
			n.ID, n.PrepareCount[key], requiredPrepares)

		if n.Behavior == BehaviorMalicious {
			shouldRefuseCommit := rand.Float64() < n.MaliciousRate
			if shouldRefuseCommit {
				log.Printf("Node %s: MALICIOUS behavior - REFUSING to send COMMIT", n.ID)
				return // Don't send COMMIT message
			}
		}

		// Send COMMIT message
		commitMsg := PBFTMessage{
			Type:        CommitMsg,
			View:        n.View,
			SequenceNum: sequenceNum,
			NodeID:      n.ID,
			BlockHash:   blockHash,
			Timestamp:   time.Now(),
		}

		n.State = StateCommit

		commitKey := fmt.Sprintf("%d-%s", sequenceNum, blockHash)
		n.CommitCount[commitKey]++

		// Broadcast COMMIT to all peers
		go n.broadcastMessage(commitMsg)

		n.checkCommitThreshold(commitKey, sequenceNum, blockHash)
	}
}

// checkCommitThreshold checks if the commit threshold is reached
func (n *PBFTNode) checkCommitThreshold(key string, sequenceNum int, blockHash string) {
	// Calculate required COMMIT messages: need 2f+1 total
	totalNodes := len(n.Peers) + 1 // +1 for self
	f := (totalNodes - 1) / 3      // Maximum faulty nodes
	requiredCommits := 2*f + 1     // Need 2f+1 COMMIT messages

	if n.CommitCount[key] >= requiredCommits {
		log.Printf("Node %s: Commit threshold reached (%d/%d), Block %s COMMITTED!",
			n.ID, n.CommitCount[key], requiredCommits, blockHash[:8])

		// Find the original block data
		var blockData string
		for _, logMsg := range n.MessageLog {
			if logMsg.Type == PrePrepareMsg && logMsg.BlockHash == blockHash {
				blockData = logMsg.BlockData
				break
			}
		}

		// Execute the block (integrate with blockchain)
		if n.OnBlockCommitted != nil && blockData != "" {
			var block interface{}
			if err := json.Unmarshal([]byte(blockData), &block); err == nil {
				n.OnBlockCommitted(block)
			}
		}

		// Reset state for next consensus round
		n.State = StateIdle
		n.SequenceNum++

		// Clean up old counts
		delete(n.PrepareCount, key)
		delete(n.CommitCount, key)
	}
}

// broadcastMessage sends a message to all peers
func (n *PBFTNode) broadcastMessage(msg PBFTMessage) {
	msgJSON, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Node %s: Failed to marshal message: %v", n.ID, err)
		return
	}

	for _, peer := range n.Peers {
		if !peer.Active {
			continue
		}

		go func(p *Peer) {
			url := fmt.Sprintf("http://%s:%d/pbft/message", p.Address, p.Port)
			resp, err := http.Post(url, "application/json", bytes.NewBuffer(msgJSON))
			if err != nil {
				log.Printf("Node %s: Failed to send message to %s: %v", n.ID, p.ID, err)
				return
			}
			resp.Body.Close()
		}(peer)
	}
}

// GetStatus returns the current status of the node
func (n *PBFTNode) GetStatus() map[string]interface{} {
	n.mutex.RLock()
	defer n.mutex.RUnlock()

	return map[string]interface{}{
		"id":             n.ID,
		"state":          n.State,
		"view":           n.View,
		"sequence_num":   n.SequenceNum,
		"is_primary":     n.IsPrimary,
		"peer_count":     len(n.Peers),
		"message_count":  len(n.MessageLog),
		"behavior":       n.Behavior,
		"malicious_rate": n.MaliciousRate,
	}
}

// validateBlock validates the block data and hash with Byzantine fault tolerance
func (n *PBFTNode) validateBlock(blockData string, blockHash string) bool {
	// Simulate malicious behavior
	if n.Behavior == BehaviorMalicious {
		shouldReject := rand.Float64() < n.MaliciousRate
		log.Printf("Node %s: MALICIOUS behavior - %s block (rate: %.2f)",
			n.ID, map[bool]string{true: "REJECTING", false: "ACCEPTING"}[shouldReject], n.MaliciousRate)
		return !shouldReject
	}

	if n.Behavior == BehaviorCrash {
		// Crashed node doesn't validate anything
		log.Printf("Node %s: CRASHED - not validating", n.ID)
		return false
	}

	// Honest validation
	var block map[string]interface{}
	if err := json.Unmarshal([]byte(blockData), &block); err != nil {
		log.Printf("Node %s: Invalid block structure", n.ID)
		return false
	}

	// Validate block hash
	hash := sha256.Sum256([]byte(blockData))
	expectedHash := hex.EncodeToString(hash[:])
	if expectedHash != blockHash {
		log.Printf("Node %s: Block hash mismatch", n.ID)
		return false
	}

	// Additional validation: check if transactions are valid
	if transactions, ok := block["transactions"].([]interface{}); ok {
		for _, tx := range transactions {
			if !n.validateTransaction(tx) {
				log.Printf("Node %s: Invalid transaction in block", n.ID)
				return false
			}
		}
	}

	log.Printf("Node %s: Block validation PASSED", n.ID)
	return true
}

// validateTransaction validates a single transaction
func (n *PBFTNode) validateTransaction(tx interface{}) bool {
	txMap, ok := tx.(map[string]interface{})
	if !ok {
		return false
	}

	// Check required fields
	requiredFields := []string{"voter_id", "candidate", "timestamp"}
	for _, field := range requiredFields {
		if _, exists := txMap[field]; !exists {
			return false
		}
	}

	// Validate candidate (simple validation)
	candidate, ok := txMap["candidate"].(string)
	if !ok || candidate == "" {
		return false
	}

	return true
}

// SetBehavior sets the behavior of the node for Byzantine fault tolerance
func (n *PBFTNode) SetBehavior(behavior NodeBehavior, maliciousRate float64) {
	n.mutex.Lock()
	defer n.mutex.Unlock()

	n.Behavior = behavior
	n.MaliciousRate = maliciousRate

	behaviorNames := map[NodeBehavior]string{
		BehaviorHonest:    "HONEST",
		BehaviorMalicious: "MALICIOUS",
		BehaviorCrash:     "CRASHED",
	}

	log.Printf("Node %s: Behavior set to %s (malicious rate: %.2f)",
		n.ID, behaviorNames[behavior], maliciousRate)
}
