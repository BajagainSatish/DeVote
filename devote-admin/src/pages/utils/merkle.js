// Merkle Tree implementation for blockchain voting application

export class MerkleTree {
    /**
     * Build a Merkle tree from an array of transactions
     * @param {Array} transactions - Array of transaction objects
     * @returns {Object} - Object containing the root hash and tree structure
     */
    static buildMerkleTree(transactions) {
        if (!transactions || transactions.length === 0) {
            return { root: "", tree: [] }
        }

        // Convert transactions to hashes
        const leaves = transactions.map((tx) => this.hashTransaction(tx))

        // Build the tree bottom-up
        let currentLevel = [...leaves]
        const tree = [currentLevel]

        while (currentLevel.length > 1) {
            const nextLevel = []

            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i]
                const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left
                const combined = this.hash(left + right)
                nextLevel.push(combined)
            }

            currentLevel = nextLevel
            tree.push(currentLevel)
        }

        return {
            root: currentLevel[0] || "",
            tree: tree,
        }
    }

    /**
     * Generate a Merkle proof for a specific transaction
     * @param {Array} transactions - Array of all transactions
     * @param {Object} transaction - The specific transaction to prove
     * @returns {Array} - Array of proof hashes
     */
    static generateMerkleProof(transactions, transaction) {
        if (!transactions || transactions.length === 0) {
            return []
        }

        const leaves = transactions.map((tx) => this.hashTransaction(tx))
        const targetHash = this.hashTransaction(transaction)
        const targetIndex = leaves.findIndex((hash) => hash === targetHash)

        if (targetIndex === -1) {
            return []
        }

        const proof = []
        let currentLevel = [...leaves]
        let currentIndex = targetIndex

        while (currentLevel.length > 1) {
            const nextLevel = []

            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i]
                const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left

                if (i === currentIndex || i + 1 === currentIndex) {
                    // Add the sibling to the proof
                    if (i === currentIndex) {
                        proof.push({ hash: right, position: "right" })
                    } else {
                        proof.push({ hash: left, position: "left" })
                    }
                }

                nextLevel.push(this.hash(left + right))
            }

            currentLevel = nextLevel
            currentIndex = Math.floor(currentIndex / 2)
        }

        return proof
    }

    /**
     * Verify a Merkle proof
     * @param {Object} transaction - The transaction to verify
     * @param {Array} proof - The Merkle proof
     * @param {string} merkleRoot - The expected root hash
     * @returns {boolean} - True if proof is valid
     */
    static verifyMerkleProof(transaction, proof, merkleRoot) {
        if (!transaction || !proof || !merkleRoot) {
            return false
        }

        let currentHash = this.hashTransaction(transaction)

        for (const proofElement of proof) {
            if (proofElement.position === "left") {
                currentHash = this.hash(proofElement.hash + currentHash)
            } else {
                currentHash = this.hash(currentHash + proofElement.hash)
            }
        }

        return currentHash === merkleRoot
    }

    /**
     * Verify the integrity of a block by checking its Merkle root
     * @param {Object} block - The block to verify
     * @returns {boolean} - True if block integrity is valid
     */
    static verifyBlockIntegrity(block) {
        if (!block || !block.Transactions) {
            return false
        }

        const { root } = this.buildMerkleTree(block.Transactions)
        return root === (block.merkleRoot || block.MerkleRoot)
    }

    /**
     * Hash a transaction object
     * @param {Object} transaction - Transaction to hash
     * @returns {string} - SHA256 hash of the transaction
     */
    static hashTransaction(transaction) {
        if (!transaction) return ""
        // Build object in exact same order used by Go
        const txObj = {
            ID: transaction.ID || "",
            Sender: transaction.Sender || "",
            Receiver: transaction.Receiver || "",
            Payload: transaction.Payload || "",
        }
        // Only include Type if present (omitempty behaviour)
        if (transaction.Type) txObj.Type = transaction.Type

        // JSON.stringify respects insertion order so this matches Go's ordered struct.
        const json = JSON.stringify(txObj)
        // If running in Node.js replace with node crypto hash; in browser this function
        // should ideally not be used for crypto.subtle-enabled envs — prefer hashAsync().
        return this.hashSyncFallback(json) // implement a real SHA256 here for Node fallback.
    }

    /**
     * Create SHA256 hash of input string
     * @param {string} input - String to hash
     * @returns {string} - SHA256 hash
     */
    static hash(input) {
        if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
            // Browser environment with Web Crypto API - return promise
            const encoder = new TextEncoder()
            const data = encoder.encode(input)

            return window.crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
                const hashArray = Array.from(new Uint8Array(hashBuffer))
                return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
            })
        } else {
            // Fallback for older browsers - simple hash function
            let hash = 0
            if (input.length === 0) return hash.toString(16)

            for (let i = 0; i < input.length; i++) {
                const char = input.charCodeAt(i)
                hash = (hash << 5) - hash + char
                hash = hash & hash // Convert to 32-bit integer
            }

            return Math.abs(hash).toString(16).padStart(8, "0")
        }
    }

    // Async version of hash for browser
    /**
     * Create SHA256 hash of input string (async version for browser)
     * @param {string} input - String to hash
     * @returns {Promise<string>} - SHA256 hash
     */
    static async hashAsync(input) {
        if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
            // Browser environment with Web Crypto API
            const encoder = new TextEncoder()
            const data = encoder.encode(input)

            const hashBuffer = await window.crypto.subtle.digest("SHA-256", data)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
        } else {
            // Fallback for older browsers
            let hash = 0
            if (input.length === 0) return hash.toString(16)

            for (let i = 0; i < input.length; i++) {
                const char = input.charCodeAt(i)
                hash = (hash << 5) - hash + char
                hash = hash & hash // Convert to 32-bit integer
            }

            return Math.abs(hash).toString(16).padStart(8, "0")
        }
    }

    // Async version of buildMerkleTree
    /**
     * Build a Merkle tree from an array of transactions (async version)
     * @param {Array} transactions - Array of transaction objects
     * @returns {Promise<Object>} - Object containing the root hash and tree structure
     */
    static async buildMerkleTreeAsync(transactions) {
        if (!transactions || transactions.length === 0) {
            return { root: "", tree: [] }
        }

        // Convert transactions to hashes (create leaf nodes)
        let currentLevel = await Promise.all(transactions.map(async (tx) => await this.hashTransactionAsync(tx)))
        const tree = [currentLevel]

        // Build tree bottom-up
        while (currentLevel.length > 1) {
            // Duplicate last node if odd (matching Go implementation)
            if (currentLevel.length % 2 !== 0) {
                currentLevel.push(currentLevel[currentLevel.length - 1])
            }

            const nextLevel = []
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i]
                const right = currentLevel[i + 1] // Safe because we duplicated if odd
                const combined = await this.hashConcatAsync(left, right)
                nextLevel.push(combined)
            }

            currentLevel = nextLevel
            tree.push(currentLevel)
        }

        return {
            root: currentLevel[0] || "",
            tree: tree,
        }
    }

    // Async version of hashTransaction
    /**
     * Hash a transaction object (async version)
     * @param {Object} transaction - Transaction to hash
     * @returns {Promise<string>} - SHA256 hash of the transaction
     */
    static async hashTransactionAsync(transaction) {
        if (!transaction) return ""
        const txObj = {
            ID: transaction.ID || "",
            Sender: transaction.Sender || "",
            Receiver: transaction.Receiver || "",
            Payload: transaction.Payload || "",
        }
        if (transaction.Type) txObj.Type = transaction.Type

        const json = JSON.stringify(txObj)
        return await this.hashAsync(json) // keep your existing hashAsync implementation
    }

    static async hashConcatAsync(left, right) {
        // Match Go's hashConcat: concatenate hex strings and hash
        const combined = left + right
        return await this.hashAsync(combined)
    }

    // Async version of generateMerkleProof
    /**
     * Generate a Merkle proof for a specific transaction (async version)
     * @param {Array} transactions - Array of all transactions
     * @param {Object} transaction - The specific transaction to prove
     * @returns {Promise<Array>} - Array of proof hashes
     */
    static async generateMerkleProofAsync(transactions, transaction) {
        if (!transactions || transactions.length === 0) {
            return []
        }

        let currentLevel = await Promise.all(transactions.map(async (tx) => await this.hashTransactionAsync(tx)))
        const targetHash = await this.hashTransactionAsync(transaction)
        let targetIndex = currentLevel.findIndex((hash) => hash === targetHash)

        if (targetIndex === -1) {
            return []
        }

        const proof = []

        while (currentLevel.length > 1) {
            // Duplicate last node if odd (matching Go implementation)
            if (currentLevel.length % 2 !== 0) {
                currentLevel.push(currentLevel[currentLevel.length - 1])
            }

            const nextLevel = []
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i]
                const right = currentLevel[i + 1]

                if (i === targetIndex || i + 1 === targetIndex) {
                    // Add the sibling to the proof
                    if (i === targetIndex) {
                        proof.push({ hash: right, position: "right" })
                    } else {
                        proof.push({ hash: left, position: "left" })
                    }
                }

                nextLevel.push(await this.hashConcatAsync(left, right))
            }

            currentLevel = nextLevel
            targetIndex = Math.floor(targetIndex / 2)
        }

        return proof
    }

    // Async version of verifyMerkleProof
    /**
     * Verify a Merkle proof (async version)
     * @param {Object} transaction - The transaction to verify
     * @param {Array} proof - The Merkle proof
     * @param {string} merkleRoot - The expected root hash
     * @returns {Promise<boolean>} - True if proof is valid
     */
    static async verifyMerkleProofAsync(transaction, proof, merkleRoot) {
        if (!transaction || !proof || !merkleRoot) {
            return false
        }

        let currentHash = await this.hashTransactionAsync(transaction)

        for (const proofElement of proof) {
            if (proofElement.position === "left") {
                currentHash = await this.hashConcatAsync(proofElement.hash, currentHash)
            } else {
                currentHash = await this.hashConcatAsync(currentHash, proofElement.hash)
            }
        }

        return currentHash === merkleRoot
    }
}
