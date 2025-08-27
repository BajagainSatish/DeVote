import sha256 from "crypto-js/sha256"
import encHex from "crypto-js/enc-hex"

// Generate commitment
export function generateCommitment(voteChoice, secret) {
    const data = voteChoice + "|" + secret
    return sha256(data).toString(encHex)
}

// Verify commitment
export function verifyCommitment(voteChoice, secret, commitment) {
    return generateCommitment(voteChoice, secret) === commitment
}
