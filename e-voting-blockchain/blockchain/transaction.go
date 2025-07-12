package blockchain

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"time"
)

// TransactionType represents different types of blockchain transactions
// e.g. Transaction represents one vote in the system.
// e.g. A transaction is created when a voter casts a vote to a candidate.
type TransactionType string

const (
	// Voting transactions
	TxTypeVote          TransactionType = "VOTE"
	TxTypeVoterRegister TransactionType = "VOTER_REGISTER"

	// Admin transactions
	TxTypeAddCandidate    TransactionType = "ADD_CANDIDATE"
	TxTypeUpdateCandidate TransactionType = "UPDATE_CANDIDATE"
	TxTypeDeleteCandidate TransactionType = "DELETE_CANDIDATE"

	TxTypeAddParty    TransactionType = "ADD_PARTY"
	TxTypeUpdateParty TransactionType = "UPDATE_PARTY"
	TxTypeDeleteParty TransactionType = "DELETE_PARTY"

	// Election management
	TxTypeStartElection TransactionType = "START_ELECTION"
	TxTypeStopElection  TransactionType = "STOP_ELECTION"

	// User management
	TxTypeAddUser     TransactionType = "ADD_USER"
	TxTypeUpdateUser  TransactionType = "UPDATE_USER"
	TxTypeDeleteUser  TransactionType = "DELETE_USER"
	TxTypeDeleteVoter TransactionType = "DELETE_VOTER"

	// System events
	TxTypeAdminLogin TransactionType = "ADMIN_LOGIN"
	TxTypeUserLogin  TransactionType = "USER_LOGIN"
)

// TransactionData contains detailed information about the transaction
type TransactionData struct {
	Type      TransactionType        `json:"type"`
	Actor     string                 `json:"actor"`   // Who performed the action
	Target    string                 `json:"target"`  // What was affected
	Action    string                 `json:"action"`  // Description of action
	Details   map[string]interface{} `json:"details"` // Additional data
	Timestamp time.Time              `json:"timestamp"`
	IPAddress string                 `json:"ipAddress,omitempty"`
}

// Transaction represents one action in the system
type Transaction struct {
	ID       string          `json:"id"`       // Unique identifier (hash)
	Sender   string          `json:"sender"`   // The actor performing the action
	Receiver string          `json:"receiver"` // The target of the action
	Payload  string          `json:"payload"`  // Transaction type
	Data     TransactionData `json:"data"`     // Detailed transaction data
}

// NewTransaction creates and returns a new transaction with detailed data
func NewTransaction(txType TransactionType, actor, target, action string, details map[string]interface{}, ipAddress string) Transaction {
	data := TransactionData{
		Type:      txType,
		Actor:     actor,
		Target:    target,
		Action:    action,
		Details:   details,
		Timestamp: time.Now(),
		IPAddress: ipAddress,
	}

	// Create transaction
	tx := Transaction{
		Sender:   actor,
		Receiver: target,
		Payload:  string(txType),
		Data:     data,
	}

	// Generate hash ID
	dataBytes, _ := json.Marshal(tx)
	hash := sha256.Sum256(dataBytes)
	tx.ID = hex.EncodeToString(hash[:])

	return tx
}

// NewSimpleTransaction creates a simple transaction (for backward compatibility)
func NewSimpleTransaction(sender, receiver, payload string) Transaction {
	return NewTransaction(
		TransactionType(payload),
		sender,
		receiver,
		payload,
		map[string]interface{}{},
		"",
	)
}

// GetTransactionSummary returns a human-readable summary of the transaction
func (t *Transaction) GetTransactionSummary() string {
	switch t.Data.Type {
	case TxTypeVote:
		return t.Data.Actor + " voted for " + t.Data.Target
	case TxTypeVoterRegister:
		return "New voter registered: " + t.Data.Target
	case TxTypeAddCandidate:
		return "Admin added candidate: " + t.Data.Target
	case TxTypeUpdateCandidate:
		return "Admin updated candidate: " + t.Data.Target
	case TxTypeDeleteCandidate:
		return "Admin deleted candidate: " + t.Data.Target
	case TxTypeAddParty:
		return "Admin added party: " + t.Data.Target
	case TxTypeUpdateParty:
		return "Admin updated party: " + t.Data.Target
	case TxTypeDeleteParty:
		return "Admin deleted party: " + t.Data.Target
	case TxTypeStartElection:
		return "Admin started election: " + t.Data.Action
	case TxTypeStopElection:
		return "Admin stopped election"
	case TxTypeDeleteVoter:
		return "Admin deleted registered voter: " + t.Data.Target
	case TxTypeAdminLogin:
		return "Admin logged in: " + t.Data.Actor
	case TxTypeUserLogin:
		return "User logged in: " + t.Data.Actor
	default:
		return t.Data.Action
	}
}
