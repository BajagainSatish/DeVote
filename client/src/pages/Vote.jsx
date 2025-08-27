"use client"
import React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UseAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import ZKVerificationPanel from "../components/ZkVerificationPanel"
import ZKEducationPanel from "../components/ZKEducationPanel"
import VotingApiService from "../services/api"
import zkVotingService from "../services/zkVotingService"

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

  // ZK proof state
  const [lastVotedCandidateId, setLastVotedCandidateId] = useState(null)
  const [lastVotedSignature, setLastVotedSignature] = useState(null)
  const [completeVoteData, setCompleteVoteData] = useState(null)

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

      // Load previous vote data for verification
      const votedStatus = localStorage.getItem(`voted_${username}`)
      if (votedStatus) {
        setMessage("You have already cast your vote in this election.")
        setLastVotedCandidateId(localStorage.getItem(`lastVotedCandidateId_${username}`))
        setLastVotedSignature(localStorage.getItem(`lastVotedSignature_${username}`))

        const storedVoteData = localStorage.getItem(`completeVoteData_${username}`)
        if (storedVoteData) {
          setCompleteVoteData(JSON.parse(storedVoteData))
        }
      }
    } catch (err) {
      setMessage("Failed to load voting data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

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

    try {
      console.log("[v0] Starting vote process for candidate:", selectedId)

      // Validate voter eligibility first
      const voterID = username.replace("voter_", "")
      if (VotingApiService.validateAndMarkVoter) {
        await VotingApiService.validateAndMarkVoter({ voterID, candidateID: selectedId })
      }

      // Cast anonymous vote using ZK proof system
      const result = await zkVotingService.castAnonymousVote(selectedId, { voterID })
      console.log("[v0] Vote cast successfully:", result)

      // Store vote data for verification
      localStorage.setItem(`voted_${username}`, "true")
      localStorage.setItem(`lastVotedCandidateId_${username}`, selectedId)
      localStorage.setItem(`lastVotedSignature_${username}`, result.signature)
      localStorage.setItem(`completeVoteData_${username}`, JSON.stringify(result))

      setLastVotedCandidateId(selectedId)
      setLastVotedSignature(result.signature)
      setCompleteVoteData(result)

      const modeMessage = result.developmentMode ? " (Development Mode - Mock Blockchain)" : ""
      setMessage(`Vote cast successfully using zero-knowledge proof! Your vote is completely anonymous.${modeMessage}`)
      setSelectedId("")

      setTimeout(() => navigate("/dashboard"), 3000)
    } catch (err) {
      console.error("Vote error:", err)
      const errorMessage = err.message || "Unknown error occurred"
      setMessage(`Failed to cast vote: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Cast Your Anonymous Vote</h1>
          <p className="text-gray-600">Your vote will be protected by zero-knowledge cryptographic proofs</p>
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
              message.includes("successfully")
                ? "bg-green-100 border border-green-400 text-green-700"
                : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Party Filter */}
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

        {/* Candidates Grid */}
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
                  {/* Candidate Image */}
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

                  {/* Candidate Info */}
                  <div className="flex-grow">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">{candidate.name}</h3>
                      {candidate.age && <span className="text-sm text-gray-500">Age: {candidate.age}</span>}
                    </div>

                    {/* Party Info */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getPartyColor(candidate.partyId) }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">{getPartyName(candidate.partyId)}</span>
                    </div>

                    {/* Bio */}
                    {candidate.bio && <p className="text-gray-600 mb-3">{candidate.bio}</p>}

                    {/* Selection Indicator */}
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

        {/* Vote Button */}
        {filteredCandidates.length > 0 && (
          <div className="text-center">
            <button
              onClick={handleVote}
              disabled={!selectedId || submitting || !electionStatus?.isActive}
              className={`px-8 py-3 rounded-md font-semibold transition ${selectedId && !submitting && electionStatus?.isActive ? "bg-[#21978B] text-white hover:bg-[#19796e]" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              {submitting ? "Casting Anonymous Vote..." : "Cast Anonymous Vote"}
            </button>

            {selectedId && (
              <p className="text-sm text-gray-600 mt-2">
                You have selected: <strong>{candidates.find((c) => c.candidateId === selectedId)?.name}</strong>
              </p>
            )}
          </div>
        )}

        {localStorage.getItem(`voted_${username}`) && completeVoteData && (
          <div className="mt-12 space-y-8">
            <ZKEducationPanel voteData={completeVoteData} />
            <ZKVerificationPanel
              lastVotedCandidateId={lastVotedCandidateId}
              lastVotedSignature={lastVotedSignature}
              candidates={candidates}
              username={username}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default Vote
