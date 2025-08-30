"use client"

import React from "react"
import { useState } from "react"
import { ZKVotingService } from "../utils/zkVotingService"
import Navbar from "../components/Navbar"

const AnonymousVote = () => {
  const [candidates] = useState([
    { id: "candidate_1", name: "KP Oli", party: "UML", color: "#3B82F6" },
    { id: "candidate_2", name: "Sher Bahadur Deuba", party: "Nepali Congress", color: "#EF4444" },
  ])

  const [selectedCandidate, setSelectedCandidate] = useState("")
  const [votingStep, setVotingStep] = useState("select") // select, processing, complete
  const [votingProcess, setVotingProcess] = useState([])
  const [zkService] = useState(new ZKVotingService())
  const [voteResult, setVoteResult] = useState(null)

  const handleAnonymousVote = async () => {
    if (!selectedCandidate) return

    setVotingStep("processing")
    setVotingProcess([])

    try {
      // Step 1: Generate RSA Blind Signature Request
      addProcessStep("🔐 Step 1: RSA Blind Signature", "Requesting anonymous voting token from authority")
      await delay(1000)
      const blindSignatureRequest = await zkService.requestBlindSignature()

      // Step 2: Generate Zero-Knowledge Proof
      addProcessStep("🧮 Step 2: Zero-Knowledge Proof", "Proving vote validity without revealing choice")
      await delay(800)
      const zkProof = zkService.generateValidityProof(
        selectedCandidate,
        candidates.map((c) => c.id),
      )

      // Step 3: Create Anonymous Vote Commitment
      addProcessStep("🎭 Step 3: Vote Commitment", "Creating cryptographic commitment to hide vote content")
      await delay(1200)
      const commitment = zkService.createCommitment(selectedCandidate)

      // Step 4: Submit Anonymous Vote
      addProcessStep("🗳️ Step 4: Anonymous Submission", "Submitting vote with no voter identity")
      await delay(1000)
      const result = await zkService.castAnonymousVote(selectedCandidate)

      // Step 5: Blockchain Recording
      addProcessStep("⛓️ Step 5: Blockchain Recording", "Recording anonymous transaction on blockchain")
      await delay(800)

      setVoteResult({
        success: true,
        transactionId: result.transactionId,
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
    } catch (error) {
      addProcessStep("❌ Vote Failed", error.message)
      setVotingStep("select")
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

  const resetVoting = () => {
    setVotingStep("select")
    setSelectedCandidate("")
    setVotingProcess([])
    setVoteResult(null)
  }

  return (
    
    <div className="min-h-screen bg-[#F4F3F2]">
      <Navbar/>
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

        {/* Candidate Selection */}
        {votingStep === "select" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Select Your Candidate</h2>
            <div className="space-y-3 mb-6">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCandidate === candidate.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                      <span
                        className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: candidate.color }}
                      >
                        {candidate.party}
                      </span>
                    </div>
                    {selectedCandidate === candidate.id && <div className="text-blue-600 text-2xl">✓</div>}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAnonymousVote}
              disabled={!selectedCandidate}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition ${
                selectedCandidate ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              🎭 Cast Anonymous Vote
            </button>
          </div>
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
            <h2 className="text-2xl font-bold text-green-600 mb-4">✅ Vote Successfully Cast!</h2>

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

            <div className="flex gap-4">
              <button
                onClick={resetVoting}
                className="flex-1 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
              >
                Vote Again (Demo)
              </button>
              <button
                onClick={() => (window.location.href = "/blockchain")}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                View in Blockchain Explorer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnonymousVote
