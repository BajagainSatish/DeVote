package blockchain

import (
	"crypto/rand"
	"encoding/hex"
	"time"
)

// TransactionType represents the type of transaction
type TransactionType string

const (
	TxTypeVote            TransactionType = "VOTE"
	TxTypeVoterRegister   TransactionType = "VOTER_REGISTER"
	TxTypeAddCandidate    TransactionType = "ADD_CANDIDATE"
	TxTypeUpdateCandidate TransactionType = "UPDATE_CANDIDATE"
	TxTypeDeleteCandidate TransactionType = "DELETE_CANDIDATE"
	TxTypeAddParty        TransactionType = "ADD_PARTY"
	TxTypeUpdateParty     TransactionType = "UPDATE_PARTY"
	TxTypeDeleteParty     TransactionType = "DELETE_PARTY"
	TxTypeStartElection   TransactionType = "START_ELECTION"
	TxTypeStopElection    TransactionType = "STOP_ELECTION"
	TxTypeDeleteVoter     TransactionType = "DELETE_VOTER"
	TxTypeAdminLogin      TransactionType = "ADMIN_LOGIN"
	TxTypeUserLogin       TransactionType = "USER_LOGIN"
	TxTypeAddUser         TransactionType = "ADD_USER"
	TxTypeUpdateUser      TransactionType = "UPDATE_USER"
	TxTypeDeleteUser      TransactionType = "DELETE_USER"
)

// TransactionData contains the actual transaction information
type TransactionData struct {
	Type      TransactionType        `json:"type"`
	Actor     string                 `json:"actor"`
	Target    string                 `json:"target"`
	Action    string                 `json:"action"`
	Timestamp time.Time              `json:"timestamp"`
	IPAddress string                 `json:"ipAddress,omitempty"`
	Details   map[string]interface{} `json:"details,omitempty"`
}

// Transaction represents a single transaction in the blockchain
type Transaction struct {
	ID   string          `json:"id"`
	Data TransactionData `json:"data"`
}

// NewTransaction creates a new transaction with IP address
func NewTransaction(txType TransactionType, actor, target, action string, details map[string]interface{}, ipAddress string) Transaction {
	return Transaction{
		ID: generateTransactionID(),
		Data: TransactionData{
			Type:      txType,
			Actor:     actor,
			Target:    target,
			Action:    action,
			Timestamp: time.Now(),
			IPAddress: ipAddress,
			Details:   details,
		},
	}
}

// NewTransactionWithoutIP creates a new transaction without IP address (for backward compatibility)
func NewTransactionWithoutIP(txType TransactionType, actor, target, action string, details map[string]interface{}) Transaction {
	return NewTransaction(txType, actor, target, action, details, "")
}

// generateTransactionID creates a unique transaction ID
func generateTransactionID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// GetFormattedTimestamp returns a human-readable timestamp
func (t Transaction) GetFormattedTimestamp() string {
	return t.Data.Timestamp.Format("2006-01-02 15:04:05 MST")
}

// GetSummary returns a human-readable summary of the transaction
func (t Transaction) GetSummary() string {
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
