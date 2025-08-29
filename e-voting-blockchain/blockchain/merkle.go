package blockchain

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

// MerkleNode represents a node in the Merkle tree
type MerkleNode struct {
	Left  *MerkleNode
	Right *MerkleNode
	Hash  string
}

// MerkleTree represents a Merkle tree for transaction verification
type MerkleTree struct {
	Root         *MerkleNode
	Transactions []Transaction
}

// NewMerkleTree creates a new Merkle tree from transactions
func NewMerkleTree(transactions []Transaction) *MerkleTree {
	if len(transactions) == 0 {
		return &MerkleTree{
			Root:         &MerkleNode{Hash: ""},
			Transactions: transactions,
		}
	}

	// Create leaf nodes
	var nodes []*MerkleNode
	for _, tx := range transactions {
		hash := hashTransaction(tx)
		nodes = append(nodes, &MerkleNode{Hash: hash})
	}

	// Build tree bottom-up
	for len(nodes) > 1 {
		var newLevel []*MerkleNode

		for i := 0; i < len(nodes); i += 2 {
			var left, right *MerkleNode
			left = nodes[i]

			if i+1 < len(nodes) {
				right = nodes[i+1]
			} else {
				// Odd number of nodes, duplicate the last one
				right = nodes[i]
			}

			// Create parent node
			parentHash := hashPair(left.Hash, right.Hash)
			parent := &MerkleNode{
				Left:  left,
				Right: right,
				Hash:  parentHash,
			}

			newLevel = append(newLevel, parent)
		}

		nodes = newLevel
	}

	return &MerkleTree{
		Root:         nodes[0],
		Transactions: transactions,
	}
}

// ComputeMerkleRoot computes the Merkle root from a list of transactions
func ComputeMerkleRoot(transactions []Transaction) string {
	if len(transactions) == 0 {
		return ""
	}

	tree := NewMerkleTree(transactions)
	return tree.Root.Hash
}

// GenerateMerkleProof generates a Merkle proof for a specific transaction
func (mt *MerkleTree) GenerateMerkleProof(tx Transaction) ([]string, error) {
	// Find transaction index
	txIndex := -1
	for i, t := range mt.Transactions {
		if t.ID == tx.ID {
			txIndex = i
			break
		}
	}

	if txIndex == -1 {
		return nil, fmt.Errorf("transaction not found in tree")
	}

	var proof []string
	mt.generateProofRecursive(mt.Root, txIndex, len(mt.Transactions), &proof)

	return proof, nil
}

// generateProofRecursive recursively generates proof path
func (mt *MerkleTree) generateProofRecursive(node *MerkleNode, txIndex, totalTxs int, proof *[]string) {
	if node.Left == nil && node.Right == nil {
		// Leaf node, no more proof needed
		return
	}

	// Determine which subtree contains our transaction
	leftSubtreeSize := getLeftSubtreeSize(totalTxs)

	if txIndex < leftSubtreeSize {
		// Transaction is in left subtree, add right sibling to proof
		if node.Right != nil {
			*proof = append(*proof, node.Right.Hash)
		}
		mt.generateProofRecursive(node.Left, txIndex, leftSubtreeSize, proof)
	} else {
		// Transaction is in right subtree, add left sibling to proof
		if node.Left != nil {
			*proof = append(*proof, node.Left.Hash)
		}
		mt.generateProofRecursive(node.Right, txIndex-leftSubtreeSize, totalTxs-leftSubtreeSize, proof)
	}
}

// VerifyMerkleProof verifies a Merkle proof for a transaction
func VerifyMerkleProof(tx Transaction, proof []string, rootHash string) bool {
	if rootHash == "" {
		return len(proof) == 0
	}

	currentHash := hashTransaction(tx)

	for _, siblingHash := range proof {
		// Try both orders (current+sibling and sibling+current)
		hash1 := hashPair(currentHash, siblingHash)
		hash2 := hashPair(siblingHash, currentHash)

		// For simplicity, we'll use the lexicographically smaller combination
		if currentHash < siblingHash {
			currentHash = hash1
		} else {
			currentHash = hash2
		}
	}

	return currentHash == rootHash
}

// Helper functions

// hashTransaction creates a hash for a transaction
func hashTransaction(tx Transaction) string {
	data := tx.ID + tx.Sender + tx.Receiver + tx.Payload
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// hashPair creates a hash from two input hashes
func hashPair(left, right string) string {
	combined := left + right
	hash := sha256.Sum256([]byte(combined))
	return hex.EncodeToString(hash[:])
}

// getLeftSubtreeSize calculates the size of the left subtree for a given total
func getLeftSubtreeSize(total int) int {
	if total <= 1 {
		return total
	}

	// Find the largest power of 2 less than or equal to total
	powerOf2 := 1
	for powerOf2*2 <= total {
		powerOf2 *= 2
	}

	// Left subtree gets the power of 2, or half if total is exactly a power of 2
	if total == powerOf2 {
		return total / 2
	}

	return powerOf2
}
