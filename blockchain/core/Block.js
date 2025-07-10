const sha256 = require("./sha256");
const { buildMerkleTree } = require("./merkle");

class Block {
  constructor(index, timestamp, data, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data; // vote array
    this.previousHash = previousHash;
    this.merkleRoot = buildMerkleTree(this.data);
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return sha256(
      this.index + this.timestamp + this.previousHash + this.merkleRoot
    );
  }
}

module.exports = Block;
// This code defines a Block class for a blockchain, which includes properties like index, timestamp, data (votes), previous hash, merkle root, and the block's own hash. The calculateHash method computes the block's hash using SHA-256 based on its properties. The Merkle tree is built from the votes to ensure data integrity and efficient verification.
// The block's hash is calculated using the index, timestamp, previous hash, and the Merkle root of the votes. This ensures that any change in the block's data will result in a different hash, maintaining the integrity of the blockchain.