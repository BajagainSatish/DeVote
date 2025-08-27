"use client"
import React, { useState } from "react"
import { ChevronDown, ChevronRight, Eye, EyeOff, Shield, Lock, CheckCircle } from "lucide-react"

const ZKEducationPanel = ({ voteData }) => {
  const [expandedSections, setExpandedSections] = useState({})
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const zkSteps = [
    {
      id: "commitment",
      title: "1. Vote Commitment (Hidden Choice)",
      icon: <EyeOff className="w-5 h-5" />,
      status: "complete",
      explanation: "You created a hidden commitment to your vote choice",
      technical: `Your vote "${voteData?.candidateId || "KP Oli"}" was converted to: "${voteData?.ballot || "VOTE:kp10"}"`,
      zkProof: "The system stores this commitment but cannot see your actual choice until you reveal it.",
    },
    {
      id: "blinding",
      title: "2. Blind Signature (Authority Signs Without Knowing)",
      icon: <Shield className="w-5 h-5" />,
      status: "complete",
      explanation: "The election authority signed your vote without seeing what it contains",
      technical: `Your ballot was "blinded" using cryptographic math, then signed by the authority`,
      zkProof: "This proves your vote is authorized without revealing your choice to the authority.",
    },
    {
      id: "unblinding",
      title: "3. Unblind & Submit (Anonymous Submission)",
      icon: <Lock className="w-5 h-5" />,
      status: "complete",
      explanation: "You removed the blinding and submitted your vote anonymously",
      technical: `Signature: ${voteData?.signature?.substring(0, 20)}...`,
      zkProof: "Your vote is now on the blockchain but cannot be linked back to your identity.",
    },
    {
      id: "verification",
      title: "4. Zero-Knowledge Verification",
      icon: <CheckCircle className="w-5 h-5" />,
      status: "complete",
      explanation: "Anyone can verify your vote exists without knowing who cast it",
      technical: `Transaction: ${voteData?.transactionId || "tx_1756314855447_verified"}`,
      zkProof: "The blockchain proves the vote is valid without revealing voter identity.",
    },
  ]

  const anonymityFeatures = [
    {
      title: "Vote-Identity Separation",
      description: "Your vote signature cannot be mathematically linked back to your identity",
      proof: "The blind signature process ensures the authority never sees your actual vote",
    },
    {
      title: "Cryptographic Anonymity",
      description: "Even with the blockchain data, no one can determine who voted for whom",
      proof: "The unblinding process removes all traces connecting you to the final vote",
    },
    {
      title: "Public Verifiability",
      description: "Anyone can verify that votes are valid without compromising privacy",
      proof: "The signature verification works without revealing voter identities",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Section 1 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-3 text-blue-800 font-semibold">
          <Eye className="w-5 h-5" />
          Understanding Your Zero-Knowledge Vote
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold text-blue-900 mb-2">What Just Happened?</h3>
            <p className="text-blue-800">
              You successfully cast an anonymous vote using zero-knowledge cryptography. The system now knows your
              vote is valid and has been counted, but it's mathematically impossible to link this vote back to you.
            </p>
          </div>

          <div className="space-y-3">
            {zkSteps.map((step) => (
              <div key={step.id} className="border rounded-lg">
                <button
                  onClick={() => toggleSection(step.id)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-green-600">{step.icon}</div>
                    <div>
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.explanation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Badge replacement */}
                    <span className="text-green-600 border border-green-600 rounded-full px-2 py-0.5 text-xs">
                      ✓ Complete
                    </span>
                    {expandedSections[step.id] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {expandedSections[step.id] && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    <div className="mt-3 space-y-2">
                      <div>
                        <h5 className="font-medium text-sm text-gray-700">Zero-Knowledge Proof:</h5>
                        <p className="text-sm text-gray-600">{step.zkProof}</p>
                      </div>
                      {showTechnicalDetails && (
                        <div>
                          <h5 className="font-medium text-sm text-gray-700">Technical Details:</h5>
                          <code className="text-xs bg-gray-100 p-2 rounded block mt-1 font-mono">
                            {step.technical}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="font-semibold mb-3">How Anonymity is Guaranteed</div>
        <div className="space-y-4">
          {anonymityFeatures.map((feature, index) => (
            <div key={index} className="flex gap-3 p-3 bg-green-50 rounded-lg">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900">{feature.title}</h4>
                <p className="text-sm text-green-800 mb-1">{feature.description}</p>
                <p className="text-xs text-green-700 italic">Proof: {feature.proof}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="font-semibold mb-3">Proving You Voted (Without Revealing Your Choice)</div>
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <h3 className="font-semibold text-yellow-900 mb-2">Share This Proof</h3>
            <p className="text-yellow-800 mb-3">
              You can share this information to prove you voted without revealing your choice:
            </p>
            <div className="bg-white p-3 rounded border font-mono text-sm">
              <div>Transaction ID: {voteData?.transactionId || "tx_1756314855447_verified"}</div>
              <div>Block Hash: {voteData?.blockHash || "block_4dd8672c..."}</div>
              <div>Timestamp: {voteData?.timestamp || new Date().toISOString()}</div>
            </div>
            {/* Button replacement */}
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full mt-2 px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 text-sm"
            >
              {showTechnicalDetails ? "Hide" : "Show"} Technical Implementation Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ZKEducationPanel
