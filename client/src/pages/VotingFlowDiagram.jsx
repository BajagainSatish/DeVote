import React from "react"
import Navbar from "../components/Navbar"

const VotingFlowDiagram = () => {
  return (
    <div className="min-h-screen bg-[#F4F3F2]">

      <Navbar/>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">📊 Anonymous Voting Flow Diagram</h1>

        {/* Complete Method Flow */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Complete Method Flow (Button Press → Blockchain)</h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-bold text-blue-700">1. User Clicks "Cast Anonymous Vote"</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>File:</strong> pages/AnonymousVote.jsx → handleAnonymousVote()
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                handleAnonymousVote() → zkService.requestBlindSignature()
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-green-700">2. RSA Blind Signature Request</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>File:</strong> utils/zkVotingService.js → requestBlindSignature()
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                requestBlindSignature() → fetch('/api/pubkey') → fetch('/api/issue-blind-signature')
              </div>
              <p className="text-xs text-green-600 mt-1">
                <strong>Output:</strong> Blind signature hash (anonymous voting token)
              </p>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-bold text-purple-700">3. Zero-Knowledge Proof Generation</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>File:</strong> utils/zkVotingService.js → generateValidityProof()
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                generateValidityProof(candidateID, validCandidates) → creates proof hash
              </div>
              <p className="text-xs text-purple-600 mt-1">
                <strong>Output:</strong> ZK proof hash (proves vote validity without revealing choice)
              </p>
            </div>

            {/* Step 4 */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-bold text-orange-700">4. Vote Commitment Creation</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>File:</strong> utils/zkVotingService.js → createCommitment()
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                createCommitment(candidateID) → SHA-256 hash with random nonce
              </div>
              <p className="text-xs text-orange-600 mt-1">
                <strong>Output:</strong> Commitment hash (hides vote content)
              </p>
            </div>

            {/* Step 5 */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-bold text-red-700">5. Anonymous Vote Submission</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>File:</strong> utils/zkVotingService.js → castAnonymousVote()
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                castAnonymousVote() → fetch('/api/redeem-anonymous-vote')
              </div>
              <p className="text-xs text-red-600 mt-1">
                <strong>Output:</strong> Transaction ID (blockchain record)
              </p>
            </div>

            {/* Step 6 */}
            <div className="border-l-4 border-indigo-500 pl-4">
              <h3 className="font-bold text-indigo-700">6. Blockchain Recording</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>File:</strong> Backend Go code → VoteAnonymous()
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                VoteAnonymous(signatureHash, candidateID) → creates anonymous transaction
              </div>
              <p className="text-xs text-indigo-600 mt-1">
                <strong>Output:</strong> Anonymous blockchain transaction (sender = "🎭 Anonymous")
              </p>
            </div>
          </div>
        </div>

        {/* Technology Comparison */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-blue-700 mb-4">🔐 RSA Blind Signatures</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Purpose:</strong> Anonymous authentication
              </div>
              <div>
                <strong>Input:</strong> Voter's blinded vote
              </div>
              <div>
                <strong>Process:</strong> Authority signs without seeing content
              </div>
              <div>
                <strong>Output:</strong> Signature hash that proves authenticity
              </div>
              <div>
                <strong>User sees:</strong> Blind signature hash in receipt
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <strong>Validation:</strong> Others can verify signature is from authority without knowing who voted
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-green-700 mb-4">🧮 Zero-Knowledge Proof</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Purpose:</strong> Prove vote validity without revealing choice
              </div>
              <div>
                <strong>Input:</strong> Selected candidate + valid candidate list
              </div>
              <div>
                <strong>Process:</strong> Creates mathematical proof of validity
              </div>
              <div>
                <strong>Output:</strong> ZK proof hash
              </div>
              <div>
                <strong>User sees:</strong> ZK proof hash in receipt
              </div>
              <div className="bg-green-50 p-2 rounded">
                <strong>Validation:</strong> Others can verify vote is for valid candidate without knowing which one
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-purple-700 mb-4">🎭 Voter Anonymity</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Purpose:</strong> Prevent linking votes to voters
              </div>
              <div>
                <strong>Input:</strong> Vote with no voter identity
              </div>
              <div>
                <strong>Process:</strong> Creates transaction with empty sender field
              </div>
              <div>
                <strong>Output:</strong> Anonymous blockchain transaction
              </div>
              <div>
                <strong>User sees:</strong> "🎭 Anonymous" in blockchain explorer
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <strong>Validation:</strong> Vote exists on blockchain but cannot be traced to voter
              </div>
            </div>
          </div>
        </div>

        {/* User Validation Guide */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">🔍 How Users Validate Their Anonymous Vote</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-3">What User Gets (Receipt):</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">🎫</span>
                  <div>
                    <strong>Voter Token:</strong> Unique identifier to prove they voted
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">🔗</span>
                  <div>
                    <strong>Transaction ID:</strong> Blockchain transaction reference
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">🧮</span>
                  <div>
                    <strong>ZK Proof Hash:</strong> Proves vote validity
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600">🔐</span>
                  <div>
                    <strong>Blind Signature Hash:</strong> Proves vote authenticity
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-3">How to Validate:</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    1
                  </span>
                  <div>Go to Blockchain Explorer page</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    2
                  </span>
                  <div>Search for your Transaction ID</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    3
                  </span>
                  <div>Verify sender shows "🎭 Anonymous" (not your name)</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    4
                  </span>
                  <div>Check ZK Proof Hash matches your receipt</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    5
                  </span>
                  <div>Confirm timestamp matches when you voted</div>
                </li>
              </ol>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-bold text-yellow-800 mb-2">🎯 Key Point:</h4>
            <p className="text-sm text-yellow-700">
              The receipt proves you voted without revealing your choice. Anyone can verify the vote exists on the
              blockchain, but no one (including election officials) can determine who you voted for or that the vote
              came from you specifically.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VotingFlowDiagram
