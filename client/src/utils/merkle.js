// Merkle Tree verification utilities for frontend
//client/src/utils/merkle.js

export class MerkleTree {
    static hashData(data) {
        let hash = 0
        if (data.length === 0) return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" // SHA256 of empty string

        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash = hash & hash // Convert to 32bit integer
        }

        // Convert to hex and pad to 64 characters to simulate SHA256
        const hexHash = Math.abs(hash).toString(16).padStart(16, "0")
        return hexHash.repeat(4).substring(0, 64)
    }

    static hashTransaction(transaction) {
        // Go code uses tx.ID directly as the leaf hash, not a hash of the entire transaction
        return transaction.ID
    }

    static buildMerkleTree(transactions) {
        if (!transactions || transactions.length === 0) {
            return { root: "", tree: [] }
        }

        if (transactions.length === 1) {
            const txHash = transactions[0].ID
            return { root: txHash, tree: [[txHash]] }
        }

        let currentLevel = transactions.map((tx) => tx.ID)
        const tree = [currentLevel.slice()]

        if (currentLevel.length % 2 !== 0) {
            currentLevel.push(currentLevel[currentLevel.length - 1])
        }

        // Build tree bottom-up
        while (currentLevel.length > 1) {
            const nextLevel = []

            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i]
                const right = currentLevel[i + 1]
                const combined = this.hashData(left + right)
                nextLevel.push(combined)
            }

            currentLevel = nextLevel
            tree.push(currentLevel.slice())

            if (currentLevel.length > 1 && currentLevel.length % 2 !== 0) {
                currentLevel.push(currentLevel[currentLevel.length - 1])
            }
        }

        return {
            root: currentLevel[0],
            tree: tree,
        }
    }

    static verifyBlockIntegrity(block) {
        if (!block.Transactions || block.Transactions.length === 0) {
            return {
                isValid: block.merkleRoot === "",
                expectedRoot: "",
                actualRoot: block.merkleRoot,
            }
        }

        const { root } = this.buildMerkleTree(block.Transactions)
        return {
            isValid: root === block.merkleRoot,
            expectedRoot: root,
            actualRoot: block.merkleRoot,
        }
    }

    static generateMerkleProof(transactions, targetTransaction) {
        if (!transactions || transactions.length === 0) return null

        const targetHash = targetTransaction.ID
        let currentLevel = transactions.map((tx) => tx.ID)

        // Handle odd number of transactions
        if (currentLevel.length % 2 !== 0) {
            currentLevel.push(currentLevel[currentLevel.length - 1])
        }

        // Find target index
        let targetIndex = currentLevel.findIndex((hash) => hash === targetHash)
        if (targetIndex === -1) return null

        const proof = []

        while (currentLevel.length > 1) {
            const nextLevel = []
            const isLeft = targetIndex % 2 === 0
            const siblingIndex = isLeft ? targetIndex + 1 : targetIndex - 1

            if (siblingIndex < currentLevel.length) {
                proof.push({
                    hash: currentLevel[siblingIndex],
                    isLeft: !isLeft,
                })
            }

            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i]
                const right = currentLevel[i + 1]
                nextLevel.push(this.hashData(left + right))
            }

            currentLevel = nextLevel
            targetIndex = Math.floor(targetIndex / 2)

            // Handle odd number of nodes at next level
            if (currentLevel.length > 1 && currentLevel.length % 2 !== 0) {
                currentLevel.push(currentLevel[currentLevel.length - 1])
            }
        }

        return proof
    }

    static verifyMerkleProof(transaction, proof, merkleRoot) {
        let hash = transaction.ID

        for (const step of proof) {
            if (step.isLeft) {
                hash = this.hashData(step.hash + hash)
            } else {
                hash = this.hashData(hash + step.hash)
            }
        }

        return hash === merkleRoot
    }
}
