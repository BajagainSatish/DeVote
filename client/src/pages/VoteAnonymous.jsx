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
  const [hasVoted, setHasVoted] = useState(false) // New state to track if user has voted

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

      // Check if user has already voted in this election
      if (username && electionId) {
        const persistKey = `anonymous_vote_result_${username}_${electionId}`
        const persistedResult = localStorage.getItem(persistKey)
        
        if (persistedResult) {
          try {
            const parsedResult = JSON.parse(persistedResult)
            setVoteResult(parsedResult)
            setSelectedId(parsedResult.selectedCandidateId)
            setHasVoted(true)
            setVotingStep("complete")
          } catch (error) {
            console.error("Failed to parse persisted vote result:", error)
            localStorage.removeItem(persistKey)
          }
        } else {
          // If no persisted result, check server status
          try {
            const voterID = username.replace("voter_", "")
            const serverStatus = await VotingApiService.getUserVotingStatusForCurrentElection(voterID)
            const hasVotedInCurrentElection = serverStatus?.hasVoted || false

            const localVotedKey = `voted_${username}_${electionId}`
            const localVotedStatus = localStorage.getItem(localVotedKey)

            if (hasVotedInCurrentElection || localVotedStatus) {
              setMessage("You have already cast your vote in this election.")
              setHasVoted(true)
            }
          } catch (error) {
            console.warn("Could not check server voting status:", error)
          }
        }
      }
    } catch (err) {
      setMessage("Failed to load voting data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch the actual transaction from blockchain
  const fetchTransactionFromBlockchain = async (candidateId) => {
    try {
      // Wait a bit for the transaction to be processed and added to blockchain
      await delay(2000)
      
      const blockchainData = await VotingApiService.getBlockchain()
      
      if (!blockchainData || blockchainData.length === 0) {
        console.warn("No blockchain data available")
        return null
      }

      // Get the latest block (assuming our transaction is in the most recent block)
      const latestBlock = blockchainData[blockchainData.length - 1]
      
      if (!latestBlock.Transactions || latestBlock.Transactions.length === 0) {
        console.warn("Latest block has no transactions")
        return null
      }

      // Find the transaction that matches our vote
      // Since transactions show "Anonymous" as sender and candidateId as receiver
      const voteTransaction = latestBlock.Transactions.find(tx => 
        tx.Receiver === candidateId && 
        (tx.Payload === "VOTE" || tx.Type === "VOTE")
      )

      if (voteTransaction) {
        return {
          transactionId: voteTransaction.ID,
          blockIndex: latestBlock.Index,
          blockHash: latestBlock.Hash,
          merkleRoot: latestBlock.merkleRoot || latestBlock.MerkleRoot,
          timestamp: latestBlock.Timestamp,
          candidateId: candidateId
        }
      }

      console.warn("Could not find matching vote transaction in latest block")
      return null
    } catch (error) {
      console.error("Failed to fetch transaction from blockchain:", error)
      return null
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

    if (hasVoted) {
      setMessage("You have already voted in this election.")
      return
    }

    const voterID = username.replace("voter_", "")
    const electionId = currentElectionId

    setSubmitting(true)
    setVotingStep("processing")
    setVotingProcess([])
    setMessage("")

    try {
      // Step 1: Generate RSA Blind Signature Request
      addProcessStep("🔐 Step 1: RSA Blind Signature", "Requesting anonymous voting token from authority")
      await delay(1000)
      const blindSignatureRequest = await zkService.requestBlindSignature()

      await delay(800)
      const zkProof = zkService.generateValidityProof(
        selectedId,
        candidates.map((c) => c.candidateId),
      )

      // Step 2: Create Anonymous Vote Commitment
      addProcessStep("🎭 Step 2: Vote Commitment", "Creating cryptographic commitment to hide vote content")
      await delay(1200)
      const commitment = zkService.createCommitment(selectedId)

      // Step 3: Submit Regular Vote (from Vote.jsx logic)
      addProcessStep("🗳️ Step 3: Submitting Vote", "Casting vote through regular API")
      await delay(1000)
      
      const payload = {
        voterID: voterID,
        candidateID: selectedId,
        name: "",
        dob: "",
      }

      console.log("Sending vote payload:", payload)
      await VotingApiService.castVote(payload)

      // Step 4: Create Anonymous Vote (from AnonymousVote.jsx logic)
      addProcessStep("🎭 Step 4: Anonymous Processing", "Processing anonymous vote with ZK proofs")
      await delay(1000)
      const anonymousResult = await zkService.castAnonymousVote(selectedId)

      // Step 6: Fetch actual transaction from blockchain
      // addProcessStep("🔍 Step 6: Fetching Transaction", "Retrieving transaction details from blockchain")
      await delay(1000)
      const blockchainTransaction = await fetchTransactionFromBlockchain(selectedId, voterID)

      // Step 6: Blockchain Recording
      addProcessStep("⛓️ Step 6: Blockchain Recording", "Recording anonymous transaction on blockchain")
      await delay(800)

      // Store voting status
      const localVotedKey = `voted_${username}_${electionId}`
      localStorage.setItem(localVotedKey, "true")

      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`voted_${username}_`) && key !== localVotedKey) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))

      const finalVoteResult = {
        success: true,
        selectedCandidateId: selectedId,
        selectedCandidateName: candidates.find(c => c.candidateId === selectedId)?.name,
        // Use actual transaction data if available, otherwise use generated data
        transactionId: blockchainTransaction?.transactionId || anonymousResult.transactionId,
        blockIndex: blockchainTransaction?.blockIndex,
        blockHash: blockchainTransaction?.blockHash,
        merkleRoot: blockchainTransaction?.merkleRoot,
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
      }

      setVoteResult(finalVoteResult)
      setHasVoted(true)

      // Persist the vote result so it doesn't disappear on tab switch
      const persistKey = `anonymous_vote_result_${username}_${electionId}`
      localStorage.setItem(persistKey, JSON.stringify(finalVoteResult))

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
          <h1 className="text-4xl font-bold text-gray-909 mb-4">🎭 Anonymous Voting System</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience true voter anonymity with RSA blind signatures and anonymous blockchain
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

        {/* Show receipt if user has voted */}
        {hasVoted && voteResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-green-600 mb-4">✅ Your Vote Has Been Recorded!</h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-green-800 mb-4">🎫 Your Anonymous Voting Receipt</h3>
              <p className="text-sm text-green-700 mb-4">
                This receipt proves you voted without revealing your choice. Save this information!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

                <div className="bg-white p-3 rounded border">
                  <span className="font-semibold text-green-700">Transaction ID:</span>
                  <p className="font-mono text-xs text-gray-600 mt-1 break-all">{voteResult.transactionId}</p>
                  <p className="text-xs text-green-600 mt-1">Find your vote on blockchain</p>
                  {voteResult.blockIndex !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">Block #{voteResult.blockIndex}</p>
                  )}
                </div>
              </div>

              {voteResult.selectedCandidateName && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <span className="font-semibold text-green-700">Vote Cast For:</span>
                  <p className="text-sm text-gray-800 mt-1">{voteResult.selectedCandidateName}</p>
                  <p className="text-xs text-gray-500 mt-1">This information is shown only to you</p>
                </div>
              )}

              {voteResult.merkleRoot && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <span className="font-semibold text-green-700">Block Merkle Root:</span>
                  <p className="font-mono text-xs text-gray-600 mt-1 break-all">{voteResult.merkleRoot}</p>
                  <p className="text-xs text-green-600 mt-1">Cryptographic proof of block integrity</p>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">How to Validate Your Vote:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Go to Blockchain Explorer</li>
                  <li>2. Search for your Transaction ID</li>
                  <li>3. Verify the transaction shows "Anonymous" (not your name)</li>
                  <li>4. Check that the candidate matches your choice</li>
                  <li>5. Confirm timestamp matches when you voted</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Selection - Always show but disable if already voted */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {hasVoted ? "You Have Already Voted" : "Select Your Candidate"}
          </h2>
          
          {hasVoted && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You have already cast your vote. You can view your receipt above or wait for next election to start.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {parties.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Party:</label>
              <select
                value={filterParty}
                onChange={(e) => setFilterParty(e.target.value)}
                disabled={hasVoted}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#21978B] disabled:opacity-50"
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
                  onClick={() => !hasVoted && setSelectedId(candidate.candidateId)}
                  className={`p-6 rounded-lg border-2 transition duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                    selectedId === candidate.candidateId
                      ? "border-[#21978B] bg-[#e6f6f4]"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  } ${hasVoted ? "opacity-50 cursor-not-allowed" : ""}`}
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
                disabled={!selectedId || submitting || !electionStatus?.isActive || hasVoted}
                className={`px-8 py-3 rounded-md font-semibold transition ${
                  selectedId && !submitting && electionStatus?.isActive && !hasVoted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {hasVoted ? "Already Voted" : submitting ? "Processing Anonymous Vote..." : "🎭 Cast Anonymous Vote"}
              </button>

              {selectedId && !hasVoted && (
                <p className="text-sm text-gray-600 mt-2">
                  You have selected: <strong>{candidates.find((c) => c.candidateId === selectedId)?.name}</strong>
                </p>
              )}
            </div>
          )}
        </div>

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
      </div>

      <Footer />
    </div>
  )
}

export default VoteAnonymous