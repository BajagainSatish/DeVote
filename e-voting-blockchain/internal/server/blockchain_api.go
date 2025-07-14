package server

import (
	"e-voting-blockchain/blockchain"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// WebSocket connection manager
type ConnectionManager struct {
	connections map[*websocket.Conn]bool
	broadcast   chan blockchain.Transaction
	register    chan *websocket.Conn
	unregister  chan *websocket.Conn
}

var connManager = &ConnectionManager{
	connections: make(map[*websocket.Conn]bool),
	broadcast:   make(chan blockchain.Transaction),
	register:    make(chan *websocket.Conn),
	unregister:  make(chan *websocket.Conn),
}

// StartWebSocketHub starts the WebSocket connection manager
func StartWebSocketHub() {
	go connManager.run()
}

func (cm *ConnectionManager) run() {
	for {
		select {
		case conn := <-cm.register:
			cm.connections[conn] = true
			log.Printf("WebSocket client connected. Total: %d", len(cm.connections))

		case conn := <-cm.unregister:
			if _, ok := cm.connections[conn]; ok {
				delete(cm.connections, conn)
				conn.Close()
				log.Printf("WebSocket client disconnected. Total: %d", len(cm.connections))
			}

		case transaction := <-cm.broadcast:
			for conn := range cm.connections {
				err := conn.WriteJSON(map[string]interface{}{
					"type": "new_transaction",
					"data": transaction,
				})
				if err != nil {
					log.Printf("WebSocket write error: %v", err)
					delete(cm.connections, conn)
					conn.Close()
				}
			}
		}
	}
}

// HandleWebSocket handles WebSocket connections for real-time updates
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	connManager.register <- conn

	// Subscribe to blockchain events
	listener := chain.Subscribe()

	go func() {
		defer func() {
			connManager.unregister <- conn
			chain.Unsubscribe(listener)
		}()

		for {
			select {
			case tx, ok := <-listener:
				if !ok {
					return
				}
				connManager.broadcast <- tx
			}
		}
	}()

	// Keep connection alive and handle client messages
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

// HandleGetBlockchain returns the entire blockchain
func HandleGetBlockchain(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleGetBlockchain called")
	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(chain.Chain); err != nil {
		log.Printf("Failed to encode blockchain: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode blockchain"})
	}
}

// HandleGetTransactions returns all transactions with optional filtering
func HandleGetTransactions(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleGetTransactions called")
	w.Header().Set("Content-Type", "application/json")

	// Parse query parameters
	query := r.URL.Query()
	txType := query.Get("type")
	actor := query.Get("actor")
	limitStr := query.Get("limit")

	var transactions []blockchain.Transaction

	if txType != "" {
		transactions = chain.GetTransactionsByType(blockchain.TransactionType(txType))
	} else if actor != "" {
		transactions = chain.GetTransactionsByActor(actor)
	} else if limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			transactions = chain.GetRecentTransactions(limit)
		} else {
			transactions = chain.GetAllTransactions()
		}
	} else {
		transactions = chain.GetAllTransactions()
	}

	// Reverse order to show newest first
	for i, j := 0, len(transactions)-1; i < j; i, j = i+1, j-1 {
		transactions[i], transactions[j] = transactions[j], transactions[i]
	}

	if err := json.NewEncoder(w).Encode(transactions); err != nil {
		log.Printf("Failed to encode transactions: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode transactions"})
	}
}

// HandleGetBlockchainStats returns blockchain statistics
func HandleGetBlockchainStats(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleGetBlockchainStats called")
	w.Header().Set("Content-Type", "application/json")

	stats := chain.GetStats()

	if err := json.NewEncoder(w).Encode(stats); err != nil {
		log.Printf("Failed to encode blockchain stats: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode blockchain stats"})
	}
}

// HandleGetIntegrityReport returns detailed blockchain integrity information
func HandleGetIntegrityReport(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleGetIntegrityReport called")
	w.Header().Set("Content-Type", "application/json")

	report := chain.GetIntegrityReport()

	if err := json.NewEncoder(w).Encode(report); err != nil {
		log.Printf("Failed to encode integrity report: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode integrity report"})
	}
}

// HandleGetTransaction returns a specific transaction by ID
func HandleGetTransaction(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleGetTransaction called")
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	txID := vars["id"]

	transaction, err := chain.GetTransactionByID(txID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to get transaction"})
		return
	}

	if transaction == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Transaction not found"})
		return
	}

	if err := json.NewEncoder(w).Encode(transaction); err != nil {
		log.Printf("Failed to encode transaction: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode transaction"})
	}
}

// HandleGetBlock returns a specific block by index
func HandleGetBlock(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleGetBlock called")
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	indexStr := vars["index"]

	index, err := strconv.Atoi(indexStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid block index"})
		return
	}

	block, err := chain.GetBlockByIndex(index)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to get block"})
		return
	}

	if block == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Block not found"})
		return
	}

	if err := json.NewEncoder(w).Encode(block); err != nil {
		log.Printf("Failed to encode block: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode block"})
	}
}

// HandleVerifyBlockchain verifies the integrity of the blockchain
func HandleVerifyBlockchain(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleVerifyBlockchain called")
	w.Header().Set("Content-Type", "application/json")

	report := chain.GetIntegrityReport()

	response := map[string]interface{}{
		"valid":             report.IsValid,
		"totalBlocks":       report.TotalBlocks,
		"validBlocks":       report.ValidBlocks,
		"invalidBlocks":     report.InvalidBlocks,
		"verifiedAt":        report.CheckedAt,
		"totalTransactions": len(chain.GetAllTransactions()),
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Failed to encode verification result: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode verification result"})
	}
}

// HandleSystemReset handles complete system reset (admin only)
func HandleSystemReset(w http.ResponseWriter, r *http.Request) {
	log.Println("HandleSystemReset called")
	w.Header().Set("Content-Type", "application/json")

	// This should be protected by admin authentication in production
	// For now, we'll implement a basic reset

	resetResult := performSystemReset()

	if err := json.NewEncoder(w).Encode(resetResult); err != nil {
		log.Printf("Failed to encode reset result: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode reset result"})
	}
}

// SystemResetResult contains the result of a system reset
type SystemResetResult struct {
	Success      bool      `json:"success"`
	DeletedFiles []string  `json:"deletedFiles"`
	Errors       []string  `json:"errors"`
	ResetAt      time.Time `json:"resetAt"`
	Message      string    `json:"message"`
}

// performSystemReset performs the actual system reset
func performSystemReset() SystemResetResult {
	result := SystemResetResult{
		Success:      true,
		DeletedFiles: []string{},
		Errors:       []string{},
		ResetAt:      time.Now(),
	}

	// List of files to delete
	filesToDelete := []string{
		"chain.db",
		"blockchain.db",
		"blocks.json",
		"election.json",
		"candidates.json",
		"parties.json",
		"registered_voters.json",
		"voters.json",
		"users.json",
		"admin_sessions.json",
		"admin.json",
	}

	for _, file := range filesToDelete {
		if err := os.Remove(file); err != nil {
			if !os.IsNotExist(err) {
				result.Errors = append(result.Errors, fmt.Sprintf("Failed to delete %s: %v", file, err))
				result.Success = false
			}
		} else {
			result.DeletedFiles = append(result.DeletedFiles, file)
		}
	}

	if result.Success {
		result.Message = "System reset completed successfully. All data has been cleared."
	} else {
		result.Message = "System reset completed with some errors. Check the errors list for details."
	}

	return result
}
