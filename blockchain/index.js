const Blockchain = require("./core/BlockChain");
const Block = require("./core/Block");
const { generateKeys, encryptString, decryptString } = require("./core/rsa");

const voteChain = new Blockchain();
const { publicKey, privateKey } = generateKeys();

// Encrypt each vote string before storing
function encryptVotes(votes, publicKey) {
  return votes.map((v) => ({
    voter: v.voter,
    encryptedVote: encryptString(v.vote, publicKey),
  }));
}

// Sample vote batches
const votes1 = [
  { voter: "0x001", vote: "Alice" },
  { voter: "0x002", vote: "Bob" },
];

const votes2 = [
  { voter: "0x004", vote: "Bob" },
  { voter: "0x005", vote: "Alice" },
];

// Encrypt and store into blockchain
const encryptedVotes1 = encryptVotes(votes1, publicKey);
const encryptedVotes2 = encryptVotes(votes2, publicKey);

voteChain.addBlock(new Block(1, Date.now().toString(), encryptedVotes1));
voteChain.addBlock(new Block(2, Date.now().toString(), encryptedVotes2));

// ✅ Print blockchain (with encrypted vote data)
console.log("🔐 Encrypted Blockchain:");
console.log(JSON.stringify(voteChain, null, 2));

// Decrypt for tallying
function decryptVotes(encryptedVotes, privateKey) {
  return encryptedVotes.map((v) => ({
    voter: v.voter,
    vote: decryptString(v.encryptedVote, privateKey),
  }));
}

console.log("\n🗳️ Decrypted Votes in Block 1:");
console.log(decryptVotes(encryptedVotes1, privateKey));

console.log("\n🗳️ Decrypted Votes in Block 2:");
console.log(decryptVotes(encryptedVotes2, privateKey));
