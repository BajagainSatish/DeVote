package pbft

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
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
		ID:           id,
		Address:      address,
		Port:         port,
		State:        StateIdle,
		View:         0,
		SequenceNum:  0,
		IsPrimary:    false,
		Peers:        make(map[string]*Peer),
		MessageLog:   make([]PBFTMessage, 0),
		PrepareCount: make(map[string]int),
		CommitCount:  make(map[string]int),
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

	// Broadcast PRE-PREPARE to all peers
	go n.broadcastMessage(prePrepareMsg)

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

	if msg.BlockData == "" || msg.BlockHash == "" {
		return fmt.Errorf("invalid PRE-PREPARE message")
	}

	// Parse and validate block structure
	var blockData map[string]interface{}
	if err := json.Unmarshal([]byte(msg.BlockData), &blockData); err != nil {
		log.Printf("Node %s: Invalid block data in PRE-PREPARE: %v", n.ID, err)
		return fmt.Errorf("invalid block data")
	}

	// Validate block hash matches the data
	hash := sha256.Sum256([]byte(msg.BlockData))
	expectedHash := hex.EncodeToString(hash[:])
	if expectedHash != msg.BlockHash {
		log.Printf("Node %s: Block hash mismatch in PRE-PREPARE", n.ID)
		return fmt.Errorf("block hash mismatch")
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

	// Broadcast PREPARE to all peers
	go n.broadcastMessage(prepareMsg)

	return nil
}

// handlePrepare processes PREPARE messages
func (n *PBFTNode) handlePrepare(msg PBFTMessage) error {
	if n.State != StatePrePrepare && n.State != StatePrepare {
		return nil
	}

	// Count PREPARE messages for this block
	key := fmt.Sprintf("%d-%s", msg.SequenceNum, msg.BlockHash)
	n.PrepareCount[key]++

	log.Printf("Node %s: Received PREPARE from %s for block %s (count: %d)",
		n.ID, msg.NodeID, msg.BlockHash[:8], n.PrepareCount[key])

	// Check if we have enough PREPARE messages (2f+1 where f is max faulty nodes)
	// For simplicity, assume f=1, so we need 3 total nodes minimum
	requiredPrepares := 2 * 1 // 2f (excluding self)

	if n.PrepareCount[key] >= requiredPrepares {
		// Send COMMIT message
		commitMsg := PBFTMessage{
			Type:        CommitMsg,
			View:        n.View,
			SequenceNum: msg.SequenceNum,
			NodeID:      n.ID,
			BlockHash:   msg.BlockHash,
			Timestamp:   time.Now(),
		}

		n.State = StateCommit

		// Broadcast COMMIT to all peers
		go n.broadcastMessage(commitMsg)
	}

	return nil
}

// handleCommit processes COMMIT messages
func (n *PBFTNode) handleCommit(msg PBFTMessage) error {
	if n.State != StateCommit && n.State != StatePrePrepare && n.State != StatePrepare {
		return nil
	}

	// Count COMMIT messages for this block
	key := fmt.Sprintf("%d-%s", msg.SequenceNum, msg.BlockHash)
	n.CommitCount[key]++

	log.Printf("Node %s: Received COMMIT from %s for block %s (count: %d)",
		n.ID, msg.NodeID, msg.BlockHash[:8], n.CommitCount[key])

	// Check if we have enough COMMIT messages (2f+1)
	requiredCommits := 2*1 + 1 // 2f+1

	if n.CommitCount[key] >= requiredCommits {
		// Block is committed!
		log.Printf("Node %s: Block %s COMMITTED!", n.ID, msg.BlockHash[:8])

		// Find the original block data
		var blockData string
		for _, logMsg := range n.MessageLog {
			if logMsg.Type == PrePrepareMsg && logMsg.BlockHash == msg.BlockHash {
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

	return nil
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
		"id":            n.ID,
		"state":         n.State,
		"view":          n.View,
		"sequence_num":  n.SequenceNum,
		"is_primary":    n.IsPrimary,
		"peer_count":    len(n.Peers),
		"message_count": len(n.MessageLog),
	}
}
