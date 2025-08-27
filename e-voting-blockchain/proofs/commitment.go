package proofs

import (
	"crypto/sha256"
	"encoding/hex"
)

// GenerateCommitment creates a hash commitment
func GenerateCommitment(voteChoice string, secret string) string {
	data := voteChoice + "|" + secret
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// VerifyCommitment checks if commitment matches vote+secret
func VerifyCommitment(voteChoice string, secret string, commitment string) bool {
	expected := GenerateCommitment(voteChoice, secret)
	return expected == commitment
}
