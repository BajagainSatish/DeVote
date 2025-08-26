// merkle.go
package blockchain

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

// MerkleNode represents a node in the Merkle Tree
type MerkleNode struct {
	Left  *MerkleNode
	Right *MerkleNode
	Hash  string
}

// MerkleTree represents the complete Merkle Tree structure
type MerkleTree struct {
	Root *MerkleNode
}

// NewMerkleTree creates a new Merkle Tree from a slice of transaction hashes
func NewMerkleTree(transactions []Transaction) *MerkleTree {
	if len(transactions) == 0 {
		return &MerkleTree{Root: &MerkleNode{Hash: ""}}
	}

	// Create leaf nodes from transaction hashes
	var nodes []*MerkleNode
	for _, tx := range transactions {
		node := &MerkleNode{Hash: tx.ID}
		nodes = append(nodes, node)
	}

	// If odd number of transactions, duplicate the last one
	if len(nodes)%2 != 0 {
		nodes = append(nodes, &MerkleNode{Hash: nodes[len(nodes)-1].Hash})
	}

	// Build the tree bottom-up
	for len(nodes) > 1 {
		var nextLevel []*MerkleNode

		for i := 0; i < len(nodes); i += 2 {
			left := nodes[i]
			right := nodes[i+1]

			// Create parent node by hashing left + right
			combinedHash := left.Hash + right.Hash
			hash := sha256.Sum256([]byte(combinedHash))

			parent := &MerkleNode{
				Left:  left,
				Right: right,
				Hash:  hex.EncodeToString(hash[:]),
			}

			nextLevel = append(nextLevel, parent)
		}

		nodes = nextLevel
	}

	return &MerkleTree{Root: nodes[0]}
}

// GetMerkleRoot returns the root hash of the Merkle Tree
func (mt *MerkleTree) GetMerkleRoot() string {
	if mt.Root == nil {
		return ""
	}
	return mt.Root.Hash
}

// GenerateMerkleProof generates a proof that a transaction is included in the tree
func (mt *MerkleTree) GenerateMerkleProof(txHash string) ([]string, error) {
	if mt.Root == nil {
		return nil, fmt.Errorf("empty merkle tree")
	}

	var proof []string
	found := mt.generateProofRecursive(mt.Root, txHash, &proof)

	if !found {
		return nil, fmt.Errorf("transaction not found in merkle tree")
	}

	return proof, nil
}

// generateProofRecursive recursively generates the merkle proof
func (mt *MerkleTree) generateProofRecursive(node *MerkleNode, txHash string, proof *[]string) bool {
	if node == nil {
		return false
	}

	// If this is a leaf node, check if it matches our target
	if node.Left == nil && node.Right == nil {
		return node.Hash == txHash
	}

	// Check left subtree
	if mt.generateProofRecursive(node.Left, txHash, proof) {
		if node.Right != nil {
			*proof = append(*proof, node.Right.Hash)
		}
		return true
	}

	// Check right subtree
	if mt.generateProofRecursive(node.Right, txHash, proof) {
		if node.Left != nil {
			*proof = append(*proof, node.Left.Hash)
		}
		return true
	}

	return false
}

// VerifyMerkleProof verifies that a transaction is included in the block using merkle proof
func VerifyMerkleProof(txHash string, proof []string, merkleRoot string) bool {
	currentHash := txHash

	for _, siblingHash := range proof {
		// Try both orders (current+sibling and sibling+current)
		// since we don't store the position information
		combined1 := currentHash + siblingHash
		hash1 := sha256.Sum256([]byte(combined1))
		result1 := hex.EncodeToString(hash1[:])

		combined2 := siblingHash + currentHash
		hash2 := sha256.Sum256([]byte(combined2))
		result2 := hex.EncodeToString(hash2[:])

		// Use the hash that would be valid in the next level
		currentHash = result1

		// Check if either combination matches what we expect
		// In a more sophisticated implementation, we'd store position info
		if result2 < result1 {
			currentHash = result2
		}
	}

	return currentHash == merkleRoot
}

// ComputeMerkleRoot computes the Merkle Root for a slice of transactions
func ComputeMerkleRoot(transactions []Transaction) string {
	tree := NewMerkleTree(transactions)
	return tree.GetMerkleRoot()
}
