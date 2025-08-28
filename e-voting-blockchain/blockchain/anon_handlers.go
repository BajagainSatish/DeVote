//anon_handlers.go

package blockchain

import (
	"crypto/sha256"
	"e-voting-blockchain/contracts" // import your Election struct
	"encoding/hex"
	"errors"
)

// RedeemAnonymousVote receives the ballot and signature and updates election
func RedeemAnonymousVote(election *contracts.Election, ballot []byte, signatureHex string) (Transaction, error) {
	sigBytes, err := hex.DecodeString(signatureHex)
	if err != nil {
		return Transaction{}, err
	}

	if !VerifySignature(ballot, sigBytes) {
		return Transaction{}, errors.New("invalid anonymous signature")
	}

	tokenHashBytes := sha256.Sum256(append(ballot, sigBytes...))
	tokenKey := hex.EncodeToString(tokenHashBytes[:])

	exists, err := isAnonTokenUsed(tokenKey)
	if err != nil {
		return Transaction{}, err
	}
	if exists {
		return Transaction{}, errors.New("this anonymous token has already been used")
	}

	if err := markAnonTokenUsed(tokenKey); err != nil {
		return Transaction{}, err
	}

	candidateID, err := parseCandidateFromBallot(ballot)
	if err != nil {
		return Transaction{}, err
	}

	err = election.Vote("", candidateID) // empty string for anonymous voter
	if err != nil {
		return Transaction{}, err
	}

	txHash := sha256.Sum256(append(ballot, sigBytes...))
	tx := Transaction{
		ID:       hex.EncodeToString(txHash[:]),
		Sender:   "",
		Receiver: "",
		Payload:  string(ballot),
		Type:     "ANON",
	}

	return tx, nil
}

// parseCandidateFromBallot decodes the ballot and extracts candidate ID
func parseCandidateFromBallot(ballot []byte) (string, error) {
	if len(ballot) == 0 {
		return "", errors.New("ballot is empty")
	}
	// assuming ballot is just candidateID as string
	return string(ballot), nil
}
