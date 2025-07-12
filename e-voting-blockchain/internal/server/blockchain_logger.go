package server

import (
	"e-voting-blockchain/blockchain"
	"net/http"
	"strings"
)

// BlockchainLogger handles logging all actions to blockchain
type BlockchainLogger struct {
	chain *blockchain.Blockchain
}

// NewBlockchainLogger creates a new blockchain logger
func NewBlockchainLogger(chain *blockchain.Blockchain) *BlockchainLogger {
	return &BlockchainLogger{chain: chain}
}

// LogTransaction logs a transaction to the blockchain
func (bl *BlockchainLogger) LogTransaction(
	txType blockchain.TransactionType,
	actor, target, action string,
	details map[string]interface{},
	r *http.Request,
) {
	ipAddress := getClientIP(r)
	tx := blockchain.NewTransaction(txType, actor, target, action, details, ipAddress)
	bl.chain.AddTransaction(tx)
}

// LogVote logs a voting transaction
func (bl *BlockchainLogger) LogVote(voterID, candidateID string, r *http.Request) {
	details := map[string]interface{}{
		"voterID":     voterID,
		"candidateID": candidateID,
	}
	bl.LogTransaction(blockchain.TxTypeVote, voterID, candidateID, "Cast vote", details, r)
}

// LogVoterRegistration logs voter registration
func (bl *BlockchainLogger) LogVoterRegistration(voterID, email string, r *http.Request) {
	details := map[string]interface{}{
		"voterID": voterID,
		"email":   email,
	}
	bl.LogTransaction(blockchain.TxTypeVoterRegister, "system", voterID, "Voter registered", details, r)
}

// LogCandidateAction logs candidate-related actions
func (bl *BlockchainLogger) LogCandidateAction(action, adminUser, candidateID, candidateName string, details map[string]interface{}, r *http.Request) {
	var txType blockchain.TransactionType
	switch action {
	case "add":
		txType = blockchain.TxTypeAddCandidate
		action = "Added candidate"
	case "update":
		txType = blockchain.TxTypeUpdateCandidate
		action = "Updated candidate"
	case "delete":
		txType = blockchain.TxTypeDeleteCandidate
		action = "Deleted candidate"
	}

	if details == nil {
		details = make(map[string]interface{})
	}
	details["candidateID"] = candidateID
	details["candidateName"] = candidateName

	bl.LogTransaction(txType, adminUser, candidateID, action, details, r)
}

// LogPartyAction logs party-related actions
func (bl *BlockchainLogger) LogPartyAction(action, adminUser, partyID, partyName string, details map[string]interface{}, r *http.Request) {
	var txType blockchain.TransactionType
	switch action {
	case "add":
		txType = blockchain.TxTypeAddParty
		action = "Added party"
	case "update":
		txType = blockchain.TxTypeUpdateParty
		action = "Updated party"
	case "delete":
		txType = blockchain.TxTypeDeleteParty
		action = "Deleted party"
	}

	if details == nil {
		details = make(map[string]interface{})
	}
	details["partyID"] = partyID
	details["partyName"] = partyName

	bl.LogTransaction(txType, adminUser, partyID, action, details, r)
}

// LogElectionAction logs election management actions
func (bl *BlockchainLogger) LogElectionAction(action, adminUser, description string, details map[string]interface{}, r *http.Request) {
	var txType blockchain.TransactionType
	switch action {
	case "start":
		txType = blockchain.TxTypeStartElection
		action = "Started election"
	case "stop":
		txType = blockchain.TxTypeStopElection
		action = "Stopped election"
	}

	if details == nil {
		details = make(map[string]interface{})
	}
	details["description"] = description

	bl.LogTransaction(txType, adminUser, "election", action, details, r)
}

// LogUserAction logs user management actions
func (bl *BlockchainLogger) LogUserAction(action, adminUser, userID string, details map[string]interface{}, r *http.Request) {
	var txType blockchain.TransactionType
	switch action {
	case "add":
		txType = blockchain.TxTypeAddUser
		action = "Added user"
	case "update":
		txType = blockchain.TxTypeUpdateUser
		action = "Updated user"
	case "delete":
		txType = blockchain.TxTypeDeleteUser
		action = "Deleted user"
	case "delete_voter":
		txType = blockchain.TxTypeDeleteVoter
		action = "Deleted registered voter"
	}

	bl.LogTransaction(txType, adminUser, userID, action, details, r)
}

// LogLogin logs login attempts
func (bl *BlockchainLogger) LogLogin(userType, username string, success bool, r *http.Request) {
	var txType blockchain.TransactionType
	action := "Login attempt"

	if userType == "admin" {
		txType = blockchain.TxTypeAdminLogin
		if success {
			action = "Admin login successful"
		} else {
			action = "Admin login failed"
		}
	} else {
		txType = blockchain.TxTypeUserLogin
		if success {
			action = "User login successful"
		} else {
			action = "User login failed"
		}
	}

	details := map[string]interface{}{
		"success":  success,
		"userType": userType,
	}

	bl.LogTransaction(txType, username, "system", action, details, r)
}

// getClientIP extracts the client IP address from the request
func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		// X-Forwarded-For can contain multiple IPs, take the first one
		ips := strings.Split(forwarded, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}

	// Fall back to RemoteAddr
	ip := r.RemoteAddr
	if strings.Contains(ip, ":") {
		ip = strings.Split(ip, ":")[0]
	}
	return ip
}
