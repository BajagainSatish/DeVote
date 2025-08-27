"use client"

// Zero Knowledge Verification Panel Component
import React from "react"
import { useState } from "react"
import zkVotingService from "../services/zkVotingService"

const ZkVerificationPanel = ({ lastVotedCandidateId, lastVotedSignature, candidates = [] }) => {
  const [verificationResult, setVerificationResult] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  const handleVerifyAnonymity = async () => {
    if (!lastVotedCandidateId || !lastVotedSignature) {
      setVerificationResult({
        success: false,
        message: "No anonymous vote found to verify. Please cast your vote first.",
      })
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // Create the same canonical ballot that was signed
      const ballot = `VOTE:${lastVotedCandidateId}`

      // Verify with the server
      const result = await zkVotingService.verifyAnonymousVote(ballot, lastVotedSignature)

      const publicKey = await zkVotingService.getPublicKey()
      const localVerification = zkVotingService.verifyVoteSignature(
        ballot,
        lastVotedSignature,
        publicKey.n.toString(), // Ensure it's a string
        publicKey.e,
      )

      const candidateName = candidates.find((c) => c.candidateId === lastVotedCandidateId)?.name || "Unknown"

      setVerificationResult({
        success: result.isValid && result.isAnonymous,
        isValid: result.isValid,
        isAnonymous: result.isAnonymous,
        localVerification,
        candidateName,
        transactionId: result.transactionId,
        blockHash: result.blockHash,
        timestamp: result.timestamp,
        ballot,
        signature: lastVotedSignature,
        message: result.message,
        publicKey: publicKey,
        developmentMode: zkVotingService.isDevelopmentMode,
      })
    } catch (error) {
      console.error("Verification error:", error)
      setVerificationResult({
        success: false,
        message: `Verification failed: ${error.message}`,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const getVerificationIcon = () => {
    if (!verificationResult) return null

    if (verificationResult.success) {
      return (
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )
    } else {
      return (
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )
    }
  }

  if (!lastVotedCandidateId || !lastVotedSignature) {
    return null
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          Zero-Knowledge Vote Verification
        </h2>

        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            <strong>How Zero-Knowledge Verification Works:</strong>
          </p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>
              • Your vote was signed with a <strong>blind signature</strong> - the authority signed it without knowing
              your choice
            </li>
            <li>• The signature proves your vote is valid without revealing your identity</li>
            <li>• Verification confirms your vote exists on the blockchain but cannot be linked back to you</li>
            <li>
              • This process ensures <strong>complete anonymity</strong> while maintaining vote integrity
            </li>
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={handleVerifyAnonymity}
            disabled={isVerifying}
            className={`px-8 py-3 rounded-md font-semibold transition flex items-center mx-auto ${
              isVerifying ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isVerifying ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Verifying Anonymity...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verify My Vote Anonymity
              </>
            )}
          </button>
        </div>

        {verificationResult && (
          <div
            className={`mt-6 p-4 rounded-lg border-2 ${
              verificationResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start space-x-3">
              {getVerificationIcon()}
              <div className="flex-1">
                <h3 className={`font-semibold ${verificationResult.success ? "text-green-800" : "text-red-800"}`}>
                  {verificationResult.success ? "✅ Anonymity Verified!" : "❌ Verification Failed"}
                </h3>

                {verificationResult.success ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-green-700">
                      Your vote for <strong>"{verificationResult.candidateName}"</strong> has been successfully verified
                      as anonymous and valid.
                    </p>
                    <div className="text-sm text-green-600">
                      <p>✓ Vote signature is cryptographically valid</p>
                      <p>✓ Vote exists on the blockchain</p>
                      <p>✓ Vote cannot be linked to your identity</p>
                      <p>✓ Zero-knowledge proof confirmed</p>
                    </div>
                    {verificationResult.transactionId && (
                      <p className="text-xs text-green-600 font-mono">
                        Transaction ID: {verificationResult.transactionId}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-red-700 mt-2">{verificationResult.message}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {showTechnicalDetails ? "Hide" : "Show"} Technical Details
            </button>

            {showTechnicalDetails && verificationResult.success && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono">
                <div className="space-y-1">
                  <p>
                    <strong>Ballot:</strong> {verificationResult.ballot}
                  </p>
                  <p>
                    <strong>Signature:</strong> {verificationResult.signature.substring(0, 64)}...
                  </p>
                  <p>
                    <strong>Local Verification:</strong>{" "}
                    {verificationResult.localVerification ? "✓ Valid" : "✗ Invalid"}
                  </p>
                  <p>
                    <strong>Server Verification:</strong> {verificationResult.isValid ? "✓ Valid" : "✗ Invalid"}
                  </p>
                  <p>
                    <strong>Anonymity Check:</strong>{" "}
                    {verificationResult.isAnonymous ? "✓ Anonymous" : "✗ Not Anonymous"}
                  </p>
                  {verificationResult.blockHash && (
                    <p>
                      <strong>Block Hash:</strong> {verificationResult.blockHash.substring(0, 32)}...
                    </p>
                  )}
                  {/* Additional Technical Details */}
                  <p>
                    <strong>Public Key:</strong> {JSON.stringify(verificationResult.publicKey)}
                  </p>
                  <p>
                    <strong>Development Mode:</strong> {verificationResult.developmentMode ? "✓ Enabled" : "✗ Disabled"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ZkVerificationPanel
