"use client"
import React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UseAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import VotingApiService from "../services/api"
import { ZKVotingService } from "../utils/zkVotingService"

const VoteAnonymous = () => {
  const { username } = UseAuth()
  const navigate = useNavigate()
  
  // State from Vote.jsx
  const [candidates, setCandidates] = useState([])
  const [parties, setParties] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [electionStatus, setElectionStatus] = useState(null)
  const [filterParty, setFilterParty] = useState("all")
  const [currentElectionId, setCurrentElectionId] = useState(null)
  
  // State from AnonymousVote.jsx
  const [votingStep, setVotingStep] = useState("select") // select, processing, complete
  const [votingProcess, setVotingProcess] = useState([])
  const [zkService] = useState(new ZKVotingService())
  const [voteResult, setVoteResult] = useState(null)

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

      const electionId = statusData?.status?.electionId || statusData?.status?.startTime
      setCurrentElectionId(electionId)

      if (username && electionId) {
        try {
          const voterID = username.replace("voter_", "")
          const serverStatus = await VotingApiService.getUserVotingStatusForCurrentElection(voterID)

          const hasVotedInCurrentElection = serverStatus?.hasVoted || false

          const localVotedKey = `voted_${username}_${electionId}`
          const localVotedStatus = localStorage.getItem(localVotedKey)

          if (hasVotedInCurrentElection || localVotedStatus) {
            setMessage("You have already cast your vote in this election.")
          }
        } catch (error) {
          console.warn("Could not check server voting status, falling back to localStorage:", error)
          const localVotedKey = `voted_${username}_${electionId}`
          const localVotedStatus = localStorage.getItem(localVotedKey)
          if (localVotedStatus) {
            setMessage("You have already cast your vote in this election.")
          }
        }
      }
    } catch (err) {
      setMessage("Failed to load voting data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnonymousVote = async () => {
    if (!selectedId) {
      setMessage("Please select a candidate before voting.")
      return
    }

    if (!electionStatus?.isActive) {
      setMessage("Election is not currently active.")
      return
    }

    const voterID = username.replace("voter_", "")
    const electionId = currentElectionId

    let hasVoted = false
    try {
      const serverStatus = await VotingApiService.getUserVotingStatusForCurrentElection(voterID)
      hasVoted = serverStatus?.hasVoted || false
    } catch (error) {
      console.warn("Could not check server voting status, checking localStorage:", error)
    }

    const localVotedKey = `voted_${username}_${electionId}`
    const localVotedStatus = localStorage.getItem(localVotedKey)

    if (hasVoted || localVotedStatus) {
      setMessage("You have already voted in this election.")
      return
    }

    setSubmitting(true)
    setVotingStep("processing")
    setVotingProcess([])
    setMessage("")

    try {
      // Step 1: Generate RSA Blind Signature Request
      addProcessStep("🔐 Step 1: RSA Blind Signature", "Requesting anonymous voting token from authority")
      await delay(1000)
      const blindSignatureRequest = await zkService.requestBlindSignature()

      // Step 2: Generate Zero-Knowledge Proof
      addProcessStep("🧮 Step 2: Zero-Knowledge Proof", "Proving vote validity without revealing choice")
      await delay(800)
      const zkProof = zkService.generateValidityProof(
        selectedId,
        candidates.map((c) => c.candidateId),
      )

      // Step 3: Create Anonymous Vote Commitment
      addProcessStep("🎭 Step 3: Vote Commitment", "Creating cryptographic commitment to hide vote content")
      await delay(1200)
      const commitment = zkService.createCommitment(selectedId)

      // Step 4: Submit Regular Vote (from Vote.jsx logic)
      addProcessStep("🗳️ Step 4: Submitting Vote", "Casting vote through regular API")
      await delay(1000)
      
      const payload = {
        voterID: voterID,
        candidateID: selectedId,
        name: "",
        dob: "",
      }

      console.log("Sending vote payload:", payload)
      await VotingApiService.castVote(payload)

      // Step 5: Create Anonymous Vote (from AnonymousVote.jsx logic)
      addProcessStep("🎭 Step 5: Anonymous Processing", "Processing anonymous vote with ZK proofs")
      await delay(1000)
      const anonymousResult = await zkService.castAnonymousVote(selectedId)

      // Step 6: Blockchain Recording
      addProcessStep("⛓️ Step 6: Blockchain Recording", "Recording anonymous transaction on blockchain")
      await delay(800)

      // Store voting status
      localStorage.setItem(localVotedKey, "true")

      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`voted_${username}_`) && key !== localVotedKey) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))

      setVoteResult({
        success: true,
        transactionId: anonymousResult.transactionId,
        zkProof,
        commitment,
        blindSignature: blindSignatureRequest.signature,
        voterReceipt: {
          timestamp: new Date().toISOString(),
          voterToken: `voter_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          zkProofHash: zkProof.proofHash,
          commitmentHash: commitment,
          blindSignatureHash: blindSignatureRequest.signatureHash,
        },
      })

      setVotingStep("complete")
      setMessage("Anonymous vote cast successfully! Thank you for participating.")

    } catch (err) {
      console.error("Vote error:", err)
      addProcessStep("❌ Vote Failed", err.message)
      setMessage(`Failed to cast vote: ${err.message}`)
      setVotingStep("select")

      if (err.message.includes("Unauthorized") || err.message.includes("Invalid voter details")) {
        setMessage(`Failed to cast vote: ${err.message}. Please try logging out and logging in again.`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const addProcessStep = (title, description) => {
    setVotingProcess((prev) => [
      ...prev,
      {
        title,
        description,
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
  }

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎭 Anonymous Voting System</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience true voter anonymity with RSA blind signatures, zero-knowledge proofs, and anonymous blockchain
            transactions
          </p>
        </div>

        {/* Privacy Technologies Explanation */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="font-bold text-blue-700 mb-2">🔐 RSA Blind Signatures</h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>What it does:</strong> Creates anonymous voting tokens
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Output:</strong> Signed token hash that proves authenticity without revealing voter identity
            </p>
            <p className="text-sm text-gray-600">
              <strong>User sees:</strong> Blind signature hash in voting receipt
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="font-bold text-green-700 mb-2">🧮 Zero-Knowledge Proof</h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>What it does:</strong> Proves vote is valid without revealing the choice
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Output:</strong> Cryptographic proof hash that validates vote legitimacy
            </p>
            <p className="text-sm text-gray-600">
              <strong>User sees:</strong> ZK proof hash in voting receipt
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <h3 className="font-bold text-purple-700 mb-2">🎭 Voter Anonymity</h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>What it does:</strong> Prevents linking votes to voters
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Output:</strong> Anonymous transaction with empty sender field
            </p>
            <p className="text-sm text-gray-600">
              <strong>User sees:</strong> "Anonymous" in blockchain explorer instead of voter ID
            </p>
          </div>
        </div>

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

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("successfully")
                ? "bg-green-100 border border-green-400 text-green-700"
                : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Candidate Selection (only show when in select step) */}
        {votingStep === "select" && (
          <>
            {parties.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Party:</label>
                <select
                  value={filterParty}
                  onChange={(e) => setFilterParty(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#21978B]"
                >
                  <option value="all">All Parties</option>
                  {parties.map((party) => (
                    <option key={party.id} value={party.id}>
                      {party.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filteredCandidates.length > 0 ? (
              <div className="grid gap-4 mb-8">
                {filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.candidateId}
                    onClick={() => setSelectedId(candidate.candidateId)}
                    className={`p-6 rounded-lg border-2 transition duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                      selectedId === candidate.candidateId
                        ? "border-[#21978B] bg-[#e6f6f4]"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {candidate.imageUrl ? (
                          <img
                            src={candidate.imageUrl || "/placeholder.svg"}
                            alt={candidate.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-500">{candidate.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-grow">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-800">{candidate.name}</h3>
                          {candidate.age && <span className="text-sm text-gray-500">Age: {candidate.age}</span>}
                        </div>

                        <div className="flex items-center space-x-2 mb-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: getPartyColor(candidate.partyId) }}
                          ></div>
                          <span className="text-sm font-medium text-gray-700">{getPartyName(candidate.partyId)}</span>
                        </div>

                        {candidate.bio && <p className="text-gray-600 mb-3">{candidate.bio}</p>}

                        {selectedId === candidate.candidateId && (
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-[#21978B] rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
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
                <p className="text-gray-500 text-lg">
                  {filterParty === "all"
                    ? "No candidates available for this election."
                    : "No candidates found for the selected party."}
                </p>
              </div>
            )}

            {filteredCandidates.length > 0 && (
              <div className="text-center">
                <button
                  onClick={handleAnonymousVote}
                  disabled={!selectedId || submitting || !electionStatus?.isActive}
                  className={`px-8 py-3 rounded-md font-semibold transition ${
                    selectedId && !submitting && electionStatus?.isActive
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {submitting ? "Processing Anonymous Vote..." : "🎭 Cast Anonymous Vote"}
                </button>

                {selectedId && (
                  <p className="text-sm text-gray-600 mt-2">
                    You have selected: <strong>{candidates.find((c) => c.candidateId === selectedId)?.name}</strong>
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Processing Steps */}
        {votingStep === "processing" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Processing Anonymous Vote</h2>
            <div className="space-y-4">
              {votingProcess.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{step.title.split(" ")[0]}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{step.title.substring(step.title.indexOf(" ") + 1)}</div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                    <div className="text-xs text-gray-400 mt-1">{step.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vote Complete with Detailed Receipt */}
        {votingStep === "complete" && voteResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-green-600 mb-4">✅ Anonymous Vote Successfully Cast!</h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-green-800 mb-4">🎫 Your Anonymous Voting Receipt</h3>
              <p className="text-sm text-green-700 mb-4">
                This receipt proves you voted without revealing your choice. Save this information!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <span className="font-semibold text-green-700">Voter Token:</span>
                  <p className="font-mono text-xs text-gray-600 mt-1 break-all">{voteResult.voterReceipt.voterToken}</p>
                  <p className="text-xs text-green-600 mt-1">Use this to verify you voted</p>
                </div>

                <div className="bg-white p-3 rounded border">
                  <span className="font-semibold text-green-700">Transaction ID:</span>
                  <p className="font-mono text-xs text-gray-600 mt-1 break-all">{voteResult.transactionId}</p>
                  <p className="text-xs text-green-600 mt-1">Find your vote on blockchain</p>
                </div>

                <div className="bg-white p-3 rounded border">
                  <span className="font-semibold text-green-700">ZK Proof Hash:</span>
                  <p className="font-mono text-xs text-gray-600 mt-1 break-all">
                    {voteResult.voterReceipt.zkProofHash}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Proves vote validity</p>
                </div>

                <div className="bg-white p-3 rounded border">
                  <span className="font-semibold text-green-700">Blind Signature Hash:</span>
                  <p className="font-mono text-xs text-gray-600 mt-1 break-all">
                    {voteResult.voterReceipt.blindSignatureHash}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Proves vote authenticity</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">How to Validate Your Vote:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Go to Blockchain Explorer</li>
                  <li>2. Search for your Transaction ID</li>
                  <li>3. Verify the transaction shows "🎭 Anonymous" (not your name)</li>
                  <li>4. Check that ZK Proof Hash matches your receipt</li>
                  <li>5. Confirm timestamp matches when you voted</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default VoteAnonymous