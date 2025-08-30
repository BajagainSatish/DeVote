import React from "react"
import Navbar from "../components/Navbar"

const VotingFlowDiagram = () => {
  return (
    <div className="min-h-screen bg-[#F4F3F2]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          📊 Anonymous Voting Flow Diagram
        </h1>

        {/* Complete Method Flow */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            Complete Method Flow (Button Press → Blockchain)
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-bold text-blue-700">
                1. User Clicks "Cast Anonymous Vote"
              </h3>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-green-700">
                2. RSA Blind Signature Request
              </h3>
              <p className="text-xs text-green-600 mt-1">
                <strong>Output:</strong> Blind signature hash (anonymous voting token)
              </p>
            </div>

            {/* Step 4 */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-bold text-orange-700">
                3. Vote Commitment Creation
              </h3>
              <p className="text-xs text-orange-600 mt-1">
                <strong>Output:</strong> Commitment hash (hides vote content)
              </p>
            </div>

            {/* Step 5 */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-bold text-red-700">
                4. Anonymous Vote Submission
              </h3>
              <p className="text-xs text-red-600 mt-1">
                <strong>Output:</strong> Transaction ID (blockchain record)
              </p>
            </div>

            {/* Step 6 */}
            <div className="border-l-4 border-indigo-500 pl-4">
              <h3 className="font-bold text-indigo-700">
                5. Blockchain Recording
              </h3>
              <p className="text-xs text-indigo-600 mt-1">
                <strong>Output:</strong> Anonymous blockchain transaction (sender = "🎭 Anonymous")
              </p>
            </div>
          </div>
        </div>

        {/* User Validation Guide */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">
            🔍 How Users Validate Their Anonymous Vote
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-3">
                What User Gets (Receipt):
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">🔗</span>
                  <div>
                    <strong>Transaction ID:</strong> Blockchain transaction reference
                    <strong>Vote Cast For:</strong> Candidate identifier recorded anonymously  
                    <strong>Block Merkle Root:</strong> Cryptographic root proving vote inclusion in block  
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
                  <div>Verify sender shows "Anonymous"</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    4
                  </span>
                  <div>4. Check that the candidate matches your choice</div>
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
        </div>
      </div>
    </div>
  )
}

export default VotingFlowDiagram
