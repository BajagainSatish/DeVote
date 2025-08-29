package main

import (
	"e-voting-blockchain/blockchain"
	"e-voting-blockchain/internal/pbft"
	"e-voting-blockchain/internal/server"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
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

	// Change to node-specific data directory
	if err := os.Chdir(nodeDataDir); err != nil {
		log.Fatalf("Failed to change to data directory: %v", err)
	}

	// Load network configuration
	networkConfig, err := pbft.LoadNetworkConfig(*config)
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

	// Initialize blockchain
	bc := blockchain.NewBlockchain()
	log.Printf("Node %s: Blockchain initialized with %d blocks", *nodeID, len(bc.Blocks))

	// Get peers for this node
	peers := networkConfig.GetPeersForNode(*nodeID)

	// Create PBFT node
	pbftNode := pbft.NewPBFTNode(*nodeID, nodeConfig.Address, nodeConfig.Port, peers)

	// Set up blockchain integration
	pbftNode.OnBlockCommitted = func(blockData interface{}) error {
		// Convert the committed block data back to blockchain.Block
		blockJSON, err := json.Marshal(blockData)
		if err != nil {
			return fmt.Errorf("failed to marshal block data: %v", err)
		}

		var block blockchain.Block
		if err := json.Unmarshal(blockJSON, &block); err != nil {
			return fmt.Errorf("failed to unmarshal block: %v", err)
		}

		// Add the committed block to our blockchain
		bc.Blocks = append(bc.Blocks, block)
		blockchain.SaveBlock(block)

		log.Printf("Node %s: Block #%d committed to blockchain", *nodeID, block.Index)
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

	// Original blockchain routes (modified for PBFT)
	r.HandleFunc("/vote", pbftServer.handleVote).Methods("POST", "OPTIONS")
	r.HandleFunc("/tally", pbftServer.handleTally).Methods("GET", "OPTIONS")
	r.HandleFunc("/blockchain", pbftServer.handleGetBlockchain).Methods("GET")

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
	if !s.node.IsPrimary {
		http.Error(w, "Only primary can start consensus", http.StatusForbidden)
		return
	}

	// Get pending transactions
	pendingTxs := s.blockchain.GetPendingTransactions()
	if len(pendingTxs) == 0 {
		http.Error(w, "No pending transactions", http.StatusBadRequest)
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

	// Start PBFT consensus for this block
	if err := s.node.StartConsensus(newBlock); err != nil {
		http.Error(w, fmt.Sprintf("Failed to start consensus: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "consensus started"})
}

// handleVote processes votes through PBFT consensus
func (s *PBFTServer) handleVote(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

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

	// Create transaction
	tx := blockchain.NewTransaction(req.VoterID, req.CandidateID, "VOTE")

	// Add to pending transactions
	s.blockchain.AddTransaction(tx)

	// If this node is primary and we have enough transactions, start consensus
	if s.node.IsPrimary && s.blockchain.GetPendingTransactionCount() >= 1 {
		go func() {
			time.Sleep(2 * time.Second) // Small delay to collect more transactions

			pendingTxs := s.blockchain.GetPendingTransactions()
			if len(pendingTxs) > 0 {
				lastBlock := s.blockchain.GetLatestBlock()
				newBlock := blockchain.Block{
					Index:        len(s.blockchain.Blocks),
					Timestamp:    time.Now().Format(time.RFC3339),
					PrevHash:     lastBlock.Hash,
					Transactions: pendingTxs,
					MerkleRoot:   blockchain.ComputeMerkleRoot(pendingTxs),
					Nonce:        0,
				}

				s.node.StartConsensus(newBlock)
			}
		}()
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"transaction_id": tx.ID,
		"status":         "pending_consensus",
		"message":        "Vote submitted for consensus",
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

// handleGetBlockchain returns the current blockchain
func (s *PBFTServer) handleGetBlockchain(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s.blockchain)
}
