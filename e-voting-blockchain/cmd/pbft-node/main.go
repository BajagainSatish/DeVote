//pbft-node/main.go

package main

import (
	"bytes"
	"e-voting-blockchain/blockchain"
	"e-voting-blockchain/internal/pbft"
	"e-voting-blockchain/internal/server"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

var (
	nodeID  = flag.String("id", "", "Node ID")
	port    = flag.Int("port", 8080, "Port to listen on")
	config  = flag.String("config", "network.json", "Network configuration file")
	dataDir = flag.String("data", "./data", "Data directory for this node")
)

type PBFTServer struct {
	node       *pbft.PBFTNode
	blockchain *blockchain.Blockchain
	server     *http.Server
}

func main() {
	flag.Parse()

	if *nodeID == "" {
		log.Fatal("Node ID is required. Use -id flag")
	}

	// Create data directory for this node
	nodeDataDir := fmt.Sprintf("%s/node_%s", *dataDir, *nodeID)
	if err := os.MkdirAll(nodeDataDir, 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	nodeDBPath := filepath.Join(nodeDataDir, "blockchain.db")

	// Load network configuration (use absolute path)
	configPath := *config
	if !filepath.IsAbs(configPath) {
		// Convert relative path to absolute before we potentially change directories
		if absPath, err := filepath.Abs(configPath); err == nil {
			configPath = absPath
		}
	}

	networkConfig, err := pbft.LoadNetworkConfig(configPath)
	if err != nil {
		log.Fatalf("Failed to load network config: %v", err)
	}

	// Find this node's configuration
	var nodeConfig *pbft.NodeConfig
	for _, nc := range networkConfig.Nodes {
		if nc.ID == *nodeID {
			nodeConfig = &nc
			break
		}
	}

	if nodeConfig == nil {
		log.Fatalf("Node %s not found in network configuration", *nodeID)
	}

	// Override port if specified
	if *port != 8080 {
		nodeConfig.Port = *port
	}

	bc := blockchain.NewBlockchain(nodeDBPath)
	log.Printf("Node %s: Blockchain initialized with %d blocks (DB: %s)", *nodeID, len(bc.Blocks), nodeDBPath)

	// Get peers for this node
	peers := networkConfig.GetPeersForNode(*nodeID)

	// Create PBFT node
	pbftNode := pbft.NewPBFTNode(*nodeID, nodeConfig.Address, nodeConfig.Port, peers)

	// Set up blockchain integration
	pbftNode.OnBlockCommitted = func(blockData interface{}) error {
		log.Printf("Node %s: OnBlockCommitted callback triggered", *nodeID)

		// Convert the committed block data back to blockchain.Block
		blockJSON, err := json.Marshal(blockData)
		if err != nil {
			log.Printf("Node %s: Failed to marshal block data: %v", *nodeID, err)
			return fmt.Errorf("failed to marshal block data: %v", err)
		}

		log.Printf("Node %s: Block JSON: %s", *nodeID, string(blockJSON)[:100])

		var block blockchain.Block
		if err := json.Unmarshal(blockJSON, &block); err != nil {
			log.Printf("Node %s: Failed to unmarshal block: %v", *nodeID, err)
			return fmt.Errorf("failed to unmarshal block: %v", err)
		}

		log.Printf("Node %s: Adding block #%d to blockchain (Hash: %s, Txs: %d)",
			*nodeID, block.Index, block.Hash[:8], len(block.Transactions))

		// Use your existing AddBlock method which expects []Transaction
		bc.AddBlock(block.Transactions) // This is correct for your implementation

		// Clear pending transactions
		bc.ClearPendingTransactions()

		log.Printf("Node %s: Block #%d successfully committed! New chain height: %d",
			*nodeID, block.Index, len(bc.Blocks))

		return nil
	}

	// Create server
	pbftServer := &PBFTServer{
		node:       pbftNode,
		blockchain: bc,
	}

	// Set up routes
	r := mux.NewRouter()

	// PBFT-specific routes
	r.HandleFunc("/pbft/message", pbftServer.handlePBFTMessage).Methods("POST")
	r.HandleFunc("/pbft/status", pbftServer.handlePBFTStatus).Methods("GET")
	r.HandleFunc("/pbft/start-consensus", pbftServer.handleStartConsensus).Methods("POST")
	r.HandleFunc("/pbft/behavior", pbftServer.handleSetBehavior).Methods("POST")

	// Original blockchain routes (modified for PBFT)
	r.HandleFunc("/vote", pbftServer.handleVote).Methods("POST", "OPTIONS")
	r.HandleFunc("/tally", pbftServer.handleTally).Methods("GET", "OPTIONS")
	r.HandleFunc("/blockchain", pbftServer.handleGetBlockchain).Methods("GET")
	r.HandleFunc("/blockchain/genesis", pbftServer.handleGetGenesis).Methods("GET")
	r.HandleFunc("/blockchain/state", pbftServer.handleGetBlockchainState).Methods("GET")
	r.HandleFunc("/blockchain/pending", pbftServer.handleGetPendingTransactions).Methods("GET")
	r.HandleFunc("/health", pbftServer.handleHealth).Methods("GET")

	// Add CORS middleware
	handler := server.CorsMiddleware(r)

	// Start server
	addr := fmt.Sprintf(":%d", nodeConfig.Port)
	pbftServer.server = &http.Server{
		Addr:    addr,
		Handler: handler,
	}

	log.Printf("Node %s starting on %s (Primary: %v)", *nodeID, addr, pbftNode.IsPrimary)
	log.Fatal(pbftServer.server.ListenAndServe())
}

// handlePBFTMessage processes incoming PBFT messages
func (s *PBFTServer) handlePBFTMessage(w http.ResponseWriter, r *http.Request) {
	var msg pbft.PBFTMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		http.Error(w, "Invalid message format", http.StatusBadRequest)
		return
	}

	if err := s.node.ProcessMessage(msg); err != nil {
		log.Printf("Error processing PBFT message: %v", err)
		http.Error(w, "Failed to process message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// handlePBFTStatus returns the current PBFT node status
func (s *PBFTServer) handlePBFTStatus(w http.ResponseWriter, r *http.Request) {
	status := s.node.GetStatus()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// handleStartConsensus manually starts consensus (for testing)
func (s *PBFTServer) handleStartConsensus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if !s.node.IsPrimary {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error":      "Only primary node can start consensus",
			"node_id":    *nodeID,
			"is_primary": "false",
		})
		return
	}

	// Get pending transactions
	pendingTxs := s.blockchain.GetPendingTransactions()
	log.Printf("Node %s: Checking pending transactions - found %d", *nodeID, len(pendingTxs))

	if len(pendingTxs) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error":      "No pending transactions available for consensus",
			"suggestion": "Submit a vote first to create pending transactions",
			"node_id":    *nodeID,
		})
		return
	}

	// Create a new block
	lastBlock := s.blockchain.GetLatestBlock()
	newBlock := blockchain.Block{
		Index:        len(s.blockchain.Blocks),
		Timestamp:    time.Now().Format(time.RFC3339),
		PrevHash:     lastBlock.Hash,
		Transactions: pendingTxs,
		MerkleRoot:   blockchain.ComputeMerkleRoot(pendingTxs),
		Nonce:        0,
	}

	newBlock.Hash = newBlock.ComputeHash()

	log.Printf("Node %s: Starting PBFT consensus for block #%d with %d transactions",
		*nodeID, newBlock.Index, len(pendingTxs))

	// Start PBFT consensus for this block
	if err := s.node.StartConsensus(newBlock); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error":   fmt.Sprintf("Failed to start consensus: %v", err),
			"node_id": *nodeID,
		})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":            "consensus_started",
		"block_index":       newBlock.Index,
		"block_hash":        newBlock.Hash,
		"transaction_count": len(pendingTxs),
		"node_id":           *nodeID,
	})
}

// handleVote processes votes through PBFT consensus
// Fix 1: Update handleVote in cmd/pbft-node/main.go
func (s *PBFTServer) handleVote(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	type VoteRequest struct {
		VoterID     string `json:"voter_id"`
		CandidateID string `json:"candidate_id"`
	}

	var req VoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request format"})
		return
	}

	log.Printf("Node %s: Received vote request - Voter: %s, Candidate: %s",
		*nodeID, req.VoterID, req.CandidateID)

	// Create transaction
	tx := blockchain.NewTransaction(req.VoterID, req.CandidateID, "VOTE")

	if !s.node.IsPrimary {
		log.Printf("Node %s: Not primary, forwarding vote to primary", *nodeID)

		// Find the actual primary node
		var primaryNode *pbft.Peer
		for _, peer := range s.node.Peers {
			// Check if this peer is the primary
			statusResp, err := http.Get(fmt.Sprintf("http://%s:%d/pbft/status", peer.Address, peer.Port))
			if err != nil {
				continue
			}
			defer statusResp.Body.Close()

			var status map[string]interface{}
			if err := json.NewDecoder(statusResp.Body).Decode(&status); err != nil {
				continue
			}

			if isPrimary, ok := status["is_primary"].(bool); ok && isPrimary {
				primaryNode = peer
				break
			}
		}

		if primaryNode != nil {
			// Forward the vote to the primary
			go func() {
				voteData, _ := json.Marshal(req)
				primaryURL := fmt.Sprintf("http://%s:%d/vote", primaryNode.Address, primaryNode.Port)
				resp, err := http.Post(primaryURL, "application/json", bytes.NewReader(voteData))
				if err != nil {
					log.Printf("Node %s: Failed to forward vote to primary: %v", *nodeID, err)
				} else {
					resp.Body.Close()
					log.Printf("Node %s: Vote forwarded to primary %s", *nodeID, primaryNode.ID)
				}
			}()
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"transaction_id": tx.ID,
			"status":         "forwarded_to_primary",
			"message":        "Vote forwarded to primary node for consensus",
			"node_type":      "backup",
		})
		return
	}

	// Primary node processing
	log.Printf("Node %s (PRIMARY): Adding transaction to pending pool", *nodeID)
	s.blockchain.AddTransaction(tx)

	pendingCount := s.blockchain.GetPendingTransactionCount()
	log.Printf("Node %s (PRIMARY): Pending transactions count: %d", *nodeID, pendingCount)

	// Auto-start consensus if we have pending transactions
	go func() {
		// Small delay to collect any additional rapid transactions
		time.Sleep(1 * time.Second)

		pendingTxs := s.blockchain.GetPendingTransactions()
		if len(pendingTxs) == 0 {
			log.Printf("Node %s (PRIMARY): No pending transactions after delay", *nodeID)
			return
		}

		log.Printf("Node %s (PRIMARY): Auto-starting consensus with %d pending transactions", *nodeID, len(pendingTxs))

		lastBlock := s.blockchain.GetLatestBlock()
		newBlock := blockchain.Block{
			Index:        len(s.blockchain.Blocks),
			Timestamp:    time.Now().Format(time.RFC3339),
			PrevHash:     lastBlock.Hash,
			Transactions: pendingTxs,
			MerkleRoot:   blockchain.ComputeMerkleRoot(pendingTxs),
			Nonce:        0,
		}

		newBlock.Hash = newBlock.ComputeHash()

		log.Printf("Node %s (PRIMARY): Starting PBFT consensus for block #%d (Hash: %s)",
			*nodeID, newBlock.Index, newBlock.Hash[:8])

		if err := s.node.StartConsensus(newBlock); err != nil {
			log.Printf("Node %s (PRIMARY): Failed to auto-start consensus: %v", *nodeID, err)
		}
	}()

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"transaction_id": tx.ID,
		"status":         "pending_consensus",
		"message":        "Vote submitted for PBFT consensus",
		"node_type":      "primary",
		"pending_count":  pendingCount,
	})
}

// handleTally returns vote tallies from the blockchain
func (s *PBFTServer) handleTally(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	tally := make(map[string]int)

	// Count votes from all blocks
	for _, block := range s.blockchain.Blocks {
		for _, tx := range block.Transactions {
			if tx.Payload == "VOTE" {
				tally[tx.Receiver]++
			}
		}
	}

	json.NewEncoder(w).Encode(tally)
}

func (s *PBFTServer) handleGetPendingTransactions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	pendingTxs := s.blockchain.GetPendingTransactions()

	response := map[string]interface{}{
		"pending_count": len(pendingTxs),
		"transactions":  pendingTxs,
		"node_id":       *nodeID,
		"is_primary":    s.node.IsPrimary,
	}

	json.NewEncoder(w).Encode(response)
}

// handleGetBlockchain returns the current blockchain
func (s *PBFTServer) handleGetBlockchain(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.blockchain)
}

func (s *PBFTServer) handleGetGenesis(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if len(s.blockchain.Blocks) == 0 {
		http.Error(w, "No genesis block found", http.StatusNotFound)
		return
	}

	genesisBlock := s.blockchain.Blocks[0]
	response := map[string]interface{}{
		"hash":      genesisBlock.Hash,
		"height":    genesisBlock.Index,
		"timestamp": genesisBlock.Timestamp,
		"prev_hash": genesisBlock.PrevHash,
	}

	json.NewEncoder(w).Encode(response)
}

func (s *PBFTServer) handleGetBlockchainState(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var blockHashes []string
	for _, block := range s.blockchain.Blocks {
		blockHashes = append(blockHashes, block.Hash)
	}

	lastHash := ""
	if len(s.blockchain.Blocks) > 0 {
		lastHash = s.blockchain.Blocks[len(s.blockchain.Blocks)-1].Hash
	}

	response := map[string]interface{}{
		"height":       len(s.blockchain.Blocks),
		"last_hash":    lastHash,
		"block_hashes": blockHashes,
		"node_id":      *nodeID,
	}

	json.NewEncoder(w).Encode(response)
}

func (s *PBFTServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

func (s *PBFTServer) handleSetBehavior(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	type BehaviorRequest struct {
		Behavior      string  `json:"behavior"`
		MaliciousRate float64 `json:"malicious_rate"`
	}

	var req BehaviorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request format"})
		return
	}

	// Convert string behavior to NodeBehavior enum
	var behavior pbft.NodeBehavior
	switch strings.ToLower(req.Behavior) {
	case "honest":
		behavior = pbft.BehaviorHonest
	case "malicious":
		behavior = pbft.BehaviorMalicious
	case "crash":
		behavior = pbft.BehaviorCrash
	default:
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid behavior. Use: honest, malicious, or crash"})
		return
	}

	// Set the behavior
	s.node.SetBehavior(behavior, req.MaliciousRate)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":         "success",
		"node_id":        *nodeID,
		"behavior":       req.Behavior,
		"malicious_rate": req.MaliciousRate,
		"message":        fmt.Sprintf("Node %s behavior set to %s", *nodeID, req.Behavior),
	})
}
