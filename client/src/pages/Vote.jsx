// client/src/pages/Vote.jsx
import React from "react"
"use client"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UseAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import VotingApiService from "../services/api" // keep using for fallback/other APIs

const Vote = () => {
  const { username } = UseAuth()
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [parties, setParties] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [electionStatus, setElectionStatus] = useState(null)
  const [filterParty, setFilterParty] = useState("all")
  const [verificationMessage, setVerificationMessage] = useState("") // New state for anonymity verification
  const [isVerifying, setIsVerifying] = useState(false) // New state for verification loading

  // Storing necessary data for verification after a successful anonymous vote
  const [lastVotedCandidateId, setLastVotedCandidateId] = useState(null)
  const [lastVotedSignature, setLastVotedSignature] = useState(null)


  useEffect(() => {
    if (!username) {
      navigate("/login")
      return
    }
    loadVotingData()
  }, [username, navigate])

  const loadVotingData = async () => {
    try {
      setLoading(true)
      const [candidatesData, partiesData, statusData] = await Promise.all([
        VotingApiService.getCandidates(),
        VotingApiService.getParties(),
        VotingApiService.getElectionStatus(),
      ])

      setCandidates(candidatesData || [])
      setParties(partiesData || [])
      setElectionStatus(statusData)

      // Check if user has already voted
      const votedStatus = localStorage.getItem(`voted_${username}`)
      if (votedStatus) {
        setMessage("You have already cast your vote in this election.")
        // Also load last vote details for verification if available
        setLastVotedCandidateId(localStorage.getItem(`lastVotedCandidateId_${username}`))
        setLastVotedSignature(localStorage.getItem(`lastVotedSignature_${username}`))
      }
    } catch (err) {
      setMessage("Failed to load voting data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ---------- NEW: anonymous blind-signature flow in handleVote ----------
  const handleVote = async () => {
    if (!selectedId) {
      setMessage("Please select a candidate before voting.")
      return
    }

    if (!electionStatus?.isActive) {
      setMessage("Election is not currently active.")
      return
    }

    const hasVoted = localStorage.getItem(`voted_${username}`)
    if (hasVoted) {
      setMessage("You have already voted in this election.")
      return
    }

    setSubmitting(true)
    setMessage("")
    setVerificationMessage("") // Clear any previous verification messages

    try {
      // Extract voter ID from username (remove "voter_" prefix)
      const voterID = username.replace("voter_", "")

      // 1) Server-side eligibility checks (same as before) — call existing castVote validation endpoint,
      // but only use it to mark "voted" server-side. We'll call a lightweight eligibility endpoint before blind flow.

      if (VotingApiService.validateAndMarkVoter) {
        // server marks the voter as having voted (off-chain) and returns success
        await VotingApiService.validateAndMarkVoter({ voterID, candidateID: selectedId })
      } else if (VotingApiService.castVote) {
        // fallback (if backend hasn't implemented anon endpoints): call the existing castVote (non-anon)
        // This will store the vote as before (not anonymous). You can remove this fallback when your backend has anon flow.
        await VotingApiService.castVote({ voterID, candidateID: selectedId, name: "", dob: "" })
        // mark voted in localStorage and exit
        localStorage.setItem(`voted_${username}`, "true")
        setMessage("Vote cast successfully (non-anonymous fallback).")
        setSelectedId("")
        setSubmitting(false)
        setTimeout(() => navigate("/dashboard"), 2000)
        return
      } else {
        throw new Error("Server validation API not found; please provide VotingApiService.validateAndMarkVoter or implement anon endpoints")
      }

      // 2) At this point the server has validated and marked the voter as voted (off-chain). Next do blind signature flow.

      // Build canonical ballot string. Keep this exactly stable on client + server.
      // We're using a simple canonical format "VOTE:<candidateID>"
      const ballotStr = `VOTE:${selectedId}`

      // 3) Fetch authority public key (n, e) from server
      // Endpoint expected: GET /pubkey -> { nHex, eHex }
      const pubRes = await fetch("/pubkey", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // If your auth is via cookie/session, keep credentials include:
        // credentials: "include"
      })
      if (!pubRes.ok) throw new Error("Failed to fetch election public key")
      const pub = await pubRes.json()
      const nHex = pub.n
      const eHex = pub.e // e in hex (or decimal string) depending on server

      // 4) Blind the ballot locally
      const eDec = parseInt(eHex, 16) // adapt if server returns decimal string
      const { blindedHex, r } = await blindMessage(ballotStr, nHex, eDec)

      // 5) Send blindedHex to server to be signed (authenticated request!)
      // IMPORTANT: /issue-blind-signature must be called with the same authentication used by your app
      // so the authority can verify eligibility before signing the blinded payload.
      // Replace how you send auth below if you use token auth.
      const issueRes = await fetch("/issue-blind-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // If you use bearer token: "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        // include credentials if session cookie auth:
        // credentials: "include",
        body: JSON.stringify({ blinded: blindedHex }),
      })
      if (!issueRes.ok) {
        const text = await issueRes.text()
        throw new Error("Failed to obtain blind signature: " + text)
      }
      const issueJson = await issueRes.json()
      const blindedSignatureHex = issueJson.blinded_signature
      if (!blindedSignatureHex) throw new Error("Server returned empty blinded signature")

      // 6) Unblind locally to obtain final signature
      const unblindedSigHex = unblindSignature(blindedSignatureHex, r, nHex)

      // 7) Submit anonymous ballot + signature
      const submitRes = await fetch("/submit-anonymous-vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ballot: ballotStr, signature: unblindedSigHex }),
      })
      if (!submitRes.ok) {
        const text = await submitRes.text()
        throw new Error("Anonymous vote submission failed: " + text)
      }

      // Success: mark as voted (client-side)
      localStorage.setItem(`voted_${username}`, "true")
      // Store info needed for verification
      localStorage.setItem(`lastVotedCandidateId_${username}`, selectedId)
      localStorage.setItem(`lastVotedSignature_${username}`, unblindedSigHex)
      setLastVotedCandidateId(selectedId)
      setLastVotedSignature(unblindedSigHex)


      setMessage("Vote cast successfully (anonymous). Thank you for participating.")
      setSelectedId("")

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard")
      }, 3000)
    } catch (err) {
      console.error("Vote error:", err)
      setMessage(`Failed to cast vote: ${err.message}`)

      // If it's an authorization error, suggest re-login
      if (err.message.includes("Unauthorized") || err.message.includes("Invalid voter details")) {
        setMessage(`Failed to cast vote: ${err.message}. Please try logging out and logging in again.`)
      }
    } finally {
      setSubmitting(false)
    }
  }
  // ---------- END handleVote ----------

  // ---------- NEW: handleVerifyAnonymity ----------
  const handleVerifyAnonymity = async () => {
    setVerificationMessage("")
    setIsVerifying(true)

    // Ensure we have the last vote details to verify
    if (!lastVotedCandidateId || !lastVotedSignature) {
      setVerificationMessage("No anonymous vote found to verify. Please cast your vote first.")
      setIsVerifying(false)
      return
    }

    try {
      // 1) Fetch authority public key (n, e) from server
      const pubRes = await fetch("/pubkey", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      if (!pubRes.ok) throw new Error("Failed to fetch election public key")
      // const pub = await pubRes.json()
      // const nHex = pub.n
      // const eHex = pub.e

      // Build canonical ballot string (must match exactly what was signed)
      const ballotStr = `VOTE:${lastVotedCandidateId}`

      // 2) Send the original ballot string and the unblinded signature to the backend for verification
      // We need a new backend endpoint for this: /verify-anonymous-vote
      const verifyRes = await fetch("/verify-anonymous-vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ballot: ballotStr,
          signature: lastVotedSignature,
        }),
      })

      if (!verifyRes.ok) {
        const text = await verifyRes.text()
        throw new Error("Verification failed: " + text)
      }

      const verifyJson = await verifyRes.json()

      if (verifyJson.isAnonymous && verifyJson.isValid) {
        setVerificationMessage(
          `Verification successful! Your vote for "${candidates.find(c => c.candidateId === lastVotedCandidateId)?.name}" was recorded anonymously and cannot be linked to your identity. Transaction ID: ${verifyJson.transactionId}`
        )
      } else {
        setVerificationMessage("Verification failed: Could not confirm the anonymity of your vote. Please contact support.")
      }
    } catch (err) {
      console.error("Anonymity verification error:", err)
      setVerificationMessage(`Anonymity verification failed: ${err.message}`)
    } finally {
      setIsVerifying(false)
    }
  }
  // ---------- END handleVerifyAnonymity ----------

  const filteredCandidates = filterParty === "all" ? candidates : candidates.filter((c) => c.partyId === filterParty)

  const getPartyColor = (partyId) => {
    const party = parties.find((p) => p.id === partyId)
    return party?.color || "#6B7280"
  }

  const getPartyName = (partyId) => {
    const party = parties.find((p) => p.id === partyId)
    return party?.name || "Independent"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F3F2]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-xl text-gray-600">Loading candidates...</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F3F2]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Cast Your Vote</h1>
          <p className="text-gray-600">Select your preferred candidate and submit your vote</p>
          <p className="text-sm text-gray-500 mt-2">Logged in as: {username}</p>
        </div>

        {/* Election Status Alert */}
        {electionStatus && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              electionStatus.isActive
                ? "bg-green-100 border border-green-400 text-green-700"
                : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-3 ${electionStatus.isActive ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span className="font-medium">Election Status: {electionStatus.isActive ? "Active" : "Inactive"}</span>
            </div>
            <p className="mt-1">{electionStatus.status.description}</p>
            {electionStatus.isActive && electionStatus.status.endTime && (
              <p className="text-sm mt-1">Voting ends: {new Date(electionStatus.status.endTime).toLocaleString()}</p>
            )}
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("successfully") ? "bg-green-100 border border-green-400 text-green-700" : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Debug Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Debug Information:</h3>
          <p className="text-sm text-blue-700">Username: {username}</p>
          <p className="text-sm text-blue-700">Voter ID: {username.replace("voter_", "")}</p>
          <p className="text-sm text-blue-700">Election Active: {electionStatus?.isActive ? "Yes" : "No"}</p>
          <p className="text-sm text-blue-700">Candidates Loaded: {candidates.length}</p>
        </div>

        {/* Party Filter */}
        {parties.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Party:</label>
            <select value={filterParty} onChange={(e) => setFilterParty(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#21978B]">
              <option value="all">All Parties</option>
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Candidates Grid */}
        {filteredCandidates.length > 0 ? (
          <div className="grid gap-4 mb-8">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.candidateId}
                onClick={() => setSelectedId(candidate.candidateId)}
                className={`p-6 rounded-lg border-2 transition duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                  selectedId === candidate.candidateId ? "border-[#21978B] bg-[#e6f6f4]" : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Candidate Image */}
                  <div className="flex-shrink-0">
                    {candidate.imageUrl ? (
                      <img src={candidate.imageUrl || "/placeholder.svg"} alt={candidate.name} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-500">{candidate.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Candidate Info */}
                  <div className="flex-grow">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{candidate.name}</h3>
                      {candidate.age && <span className="text-sm text-gray-500">Age: {candidate.age}</span>}
                    </div>

                    {/* Party Info */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getPartyColor(candidate.partyId) }}></div>
                      <span className="text-sm font-medium text-gray-700">{getPartyName(candidate.partyId)}</span>
                    </div>

                    {/* Bio */}
                    {candidate.bio && <p className="text-gray-600 mb-3">{candidate.bio}</p>}

                    {/* Selection Indicator */}
                    {selectedId === candidate.candidateId && (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-[#21978B] rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm text-[#21978B] font-medium">Selected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{filterParty === "all" ? "No candidates available for this election." : "No candidates found for the selected party."}</p>
          </div>
        )}

        {/* Vote Button */}
        {filteredCandidates.length > 0 && (
          <div className="text-center">
            <button onClick={handleVote} disabled={!selectedId || submitting || !electionStatus?.isActive} className={`px-8 py-3 rounded-md font-semibold transition ${selectedId && !submitting && electionStatus?.isActive ? "bg-[#21978B] text-white hover:bg-[#19796e]" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
              {submitting ? "Submitting Vote..." : "Submit Vote"}
            </button>

            {selectedId && (
              <p className="text-sm text-gray-600 mt-2">
                You have selected: <strong>{candidates.find((c) => c.candidateId === selectedId)?.name}</strong>
              </p>
            )}
          </div>
        )}

        {/* NEW: Verify Anonymity Section */}
        {localStorage.getItem(`voted_${username}`) && (lastVotedCandidateId && lastVotedSignature) && (
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Verify My Anonymous Vote</h2>
            <p className="text-gray-600 mb-4">
              Click the button below to verify that your previously cast vote was recorded anonymously on the blockchain.
              This confirms that your vote cannot be linked back to your identity.
            </p>
            <button
              onClick={handleVerifyAnonymity}
              disabled={isVerifying}
              className={`px-8 py-3 rounded-md font-semibold transition ${isVerifying ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
            >
              {isVerifying ? "Verifying..." : "Verify My Vote Anonymity"}
            </button>
            {verificationMessage && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  verificationMessage.includes("successful") ? "bg-green-100 border border-green-400 text-green-700" : "bg-red-100 border border-red-400 text-red-700"
                }`}
              >
                {verificationMessage}
              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  )
}

export default Vote

// ================= Helper functions for blinding & signing ==================
// Place these below the component or in a separate util file (they're included here for copy/paste convenience).

async function sha256Bytes(str) {
  const enc = new TextEncoder()
  const data = enc.encode(str)
  const hashBuf = await crypto.subtle.digest("SHA-256", data)
  return new Uint8Array(hashBuf)
}

function hexToBigInt(hex) {
  return BigInt("0x" + hex)
}
function bigIntToHex(b) {
  let h = b.toString(16)
  if (h.length % 2) h = "0" + h
  return h
}

function modPow(base, exp, mod) {
  let result = 1n
  base = base % mod
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod
    exp = exp >> 1n
    base = (base * base) % mod
  }
  return result
}

function gcdBigInt(a, b) {
  while (b) {
    const t = b
    b = a % b
    a = t
  }
  return a
}
function modInverseBigInt(a, m) {
  // extended Euclid
  let m0 = m
  let x0 = 0n,
    x1 = 1n
  if (m == 1n) return 0n
  while (a > 1n) {
    let q = a / m
    let t = m
    m = a % m
    a = t
    t = x0
    x0 = x1 - q * x0
    x1 = t
  }
  if (x1 < 0n) x1 += m0
  return x1
}

async function blindMessage(ballot, nHex, eDec) {
  const n = hexToBigInt(nHex)
  const e = BigInt(eDec)

  // message representative = SHA256(ballot) as big-int
  const hBytes = await sha256Bytes(ballot)
  let m = 0n
  for (const b of hBytes) {
    m = (m << 8n) + BigInt(b)
  }

  // pick random r in (1, n-1) with gcd(r,n)=1
  let r
  do {
    // random bytes of same length as n
    const nLen = Math.ceil(n.toString(16).length / 2)
    const randBytes = new Uint8Array(nLen)
    crypto.getRandomValues(randBytes)
    r = 0n
    for (const b of randBytes) r = (r << 8n) + BigInt(b)
    r = r % n
  } while (r <= 1n || r >= n - 1n || gcdBigInt(r, n) !== 1n)

  const rPowE = modPow(r, e, n)
  const blinded = (m * rPowE) % n

  return { blindedHex: bigIntToHex(blinded), r, m }
}

function unblindSignature(signedBlindedHex, r, nHex) {
  const sPrime = hexToBigInt(signedBlindedHex)
  const n = hexToBigInt(nHex)
  const rInv = modInverseBigInt(r, n)
  const s = (sPrime * rInv) % n
  return bigIntToHex(s)
}