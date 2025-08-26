package blockchain

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
)

// MerkleNode represents a node in the Merkle Tree
type MerkleNode struct {
	Left  *MerkleNode
	Right *MerkleNode
	Hash  string
}

// MerkleTree represents the complete Merkle Tree
type MerkleTree struct {
	Root *MerkleNode
}

// MerkleProofElement represents a single element in a Merkle proof
type MerkleProofElement struct {
	Hash     string
	Position string // "left" or "right"
}

// hashTransaction serializes and hashes a transaction deterministically
func hashTransaction(tx Transaction) string {
	data, _ := json.Marshal(tx) // sorted keys
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

// hashConcat concatenates two hex strings and returns SHA256
func hashConcat(left, right string) string {
	h := sha256.Sum256([]byte(left + right))
	return hex.EncodeToString(h[:])
}

// NewMerkleTree builds a Merkle tree from a slice of transactions
func NewMerkleTree(transactions []Transaction) *MerkleTree {
	if len(transactions) == 0 {
		return &MerkleTree{Root: &MerkleNode{Hash: ""}}
	}

	// Create leaf nodes
	nodes := []*MerkleNode{}
	for _, tx := range transactions {
		nodes = append(nodes, &MerkleNode{Hash: hashTransaction(tx)})
	}

	// Build tree bottom-up
	for len(nodes) > 1 {
		// Duplicate last node if odd
		if len(nodes)%2 != 0 {
			nodes = append(nodes, &MerkleNode{Hash: nodes[len(nodes)-1].Hash})
		}

		var nextLevel []*MerkleNode
		for i := 0; i < len(nodes); i += 2 {
			left := nodes[i]
			right := nodes[i+1]
			parent := &MerkleNode{
				Left:  left,
				Right: right,
				Hash:  hashConcat(left.Hash, right.Hash),
			}
			nextLevel = append(nextLevel, parent)
		}
		nodes = nextLevel
	}

	return &MerkleTree{Root: nodes[0]}
}

// GetMerkleRoot returns the root hash
func (mt *MerkleTree) GetMerkleRoot() string {
	if mt.Root == nil {
		return ""
	}
	return mt.Root.Hash
}

// GenerateMerkleProof generates a Merkle proof with left/right positions
func (mt *MerkleTree) GenerateMerkleProof(tx Transaction) ([]MerkleProofElement, error) {
	if mt.Root == nil {
		return nil, fmt.Errorf("empty merkle tree")
	}

	proof := []MerkleProofElement{}
	found := mt.generateProofRecursive(mt.Root, hashTransaction(tx), &proof)
	if !found {
		return nil, fmt.Errorf("transaction not found")
	}
	return proof, nil
}

func (mt *MerkleTree) generateProofRecursive(node *MerkleNode, txHash string, proof *[]MerkleProofElement) bool {
	if node == nil {
		return false
	}
	if node.Left == nil && node.Right == nil {
		return node.Hash == txHash
	}

	if mt.generateProofRecursive(node.Left, txHash, proof) {
		if node.Right != nil {
			*proof = append(*proof, MerkleProofElement{Hash: node.Right.Hash, Position: "right"})
		}
		return true
	}

	if mt.generateProofRecursive(node.Right, txHash, proof) {
		if node.Left != nil {
			*proof = append(*proof, MerkleProofElement{Hash: node.Left.Hash, Position: "left"})
		}
		return true
	}

	return false
}

// VerifyMerkleProof verifies the Merkle proof against root
func VerifyMerkleProof(tx Transaction, proof []MerkleProofElement, merkleRoot string) bool {
	currentHash := hashTransaction(tx)
	for _, p := range proof {
		if p.Position == "left" {
			currentHash = hashConcat(p.Hash, currentHash)
		} else {
			currentHash = hashConcat(currentHash, p.Hash)
		}
	}
	return currentHash == merkleRoot
}

// ComputeMerkleRoot computes Merkle root from transactions
func ComputeMerkleRoot(transactions []Transaction) string {
	tree := NewMerkleTree(transactions)
	return tree.GetMerkleRoot()
}
