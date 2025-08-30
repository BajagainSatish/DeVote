// client/src/utils/anon.js

// Fetch election public key
export async function fetchPubKey() {
    const res = await fetch("/pubkey", { method: "GET" })
    return res.json() // { n: string, e: string }
}

// Request server to sign a blinded vote
export async function issueBlindSignature(voterID, blindedVoteHex, token) {
    const res = await fetch("/issue-blind-signature", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ voterID, blindedVote: blindedVoteHex })
    })
    return res.json() // { signedBlind: string }
}

// Submit the signed vote anonymously
export async function submitAnonymousVote(candidateID, signedVoteHex) {
    const res = await fetch("/submit-anonymous-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateID, signedVote: signedVoteHex })
    })
    return res.json()
}
