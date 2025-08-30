;("use client")
import React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UseAuth } from "../context/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import VotingApiService from "../services/api"

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
  const [currentElectionId, setCurrentElectionId] = useState(null)

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

  const handleVote = async () => {
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
    setMessage("")

    try {
      const payload = {
        voterID: voterID,
        candidateID: selectedId,
        name: "",
        dob: "",
      }

      console.log("Sending vote payload:", payload)

      await VotingApiService.castVote(payload)

      localStorage.setItem(localVotedKey, "true")

      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`voted_${username}_`) && key !== localVotedKey) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))

      setMessage("Vote cast successfully! Thank you for participating.")
      setSelectedId("")

      setTimeout(() => {
        navigate("/dashboard")
      }, 3000)
    } catch (err) {
      console.error("Vote error:", err)
      setMessage(`Failed to cast vote: ${err.message}`)

      if (err.message.includes("Unauthorized") || err.message.includes("Invalid voter details")) {
        setMessage(`Failed to cast vote: ${err.message}. Please try logging out and logging in again.`)
      }
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Cast Your Vote</h1>
          <p className="text-gray-600">Select your preferred candidate and submit your vote</p>
          <p className="text-sm text-gray-500 mt-2">Logged in as: {username}</p>
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

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Debug Information:</h3>
          <p className="text-sm text-blue-700">Username: {username}</p>
          <p className="text-sm text-blue-700">Voter ID: {username.replace("voter_", "")}</p>
          <p className="text-sm text-blue-700">Election Active: {electionStatus?.isActive ? "Yes" : "No"}</p>
          <p className="text-sm text-blue-700">Candidates Loaded: {candidates.length}</p>
        </div>

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
              onClick={handleVote}
              disabled={!selectedId || submitting || !electionStatus?.isActive}
              className={`px-8 py-3 rounded-md font-semibold transition ${
                selectedId && !submitting && electionStatus?.isActive
                  ? "bg-[#21978B] text-white hover:bg-[#19796e]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {submitting ? "Submitting Vote..." : "Submit Vote"}
            </button>

            {selectedId && (
              <p className="text-sm text-gray-600 mt-2">
                You have selected: <strong>{candidates.find((c) => c.candidateId === selectedId)?.name}</strong>
              </p>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default Vote
