"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import apiService from "../../services/api"

export default function ManageVoters() {
  const [registeredVoters, setRegisteredVoters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRegisteredVoters()
  }, [])

  const fetchRegisteredVoters = async () => {
    try {
      const data = await apiService.getRegisteredVoters()
      setRegisteredVoters(data || [])
    } catch (error) {
      toast.error("Failed to fetch registered voters: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (voterID) => {
    if (!window.confirm("Are you sure you want to delete this registered voter? This action cannot be undone.")) {
      return
    }

    try {
      await apiService.deleteRegisteredVoter(voterID)
      toast.success("Registered voter deleted successfully")
      fetchRegisteredVoters() // Refresh the list
    } catch (error) {
      toast.error(error.message || "Failed to delete registered voter")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-lg text-gray-600">Loading registered voters...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#21978B]">Manage Registered Voters</h2>
        <div className="text-sm text-gray-600">Total Registered Voters: {registeredVoters.length}</div>
      </div>

      s{/* Voters Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Registered Voters</h3>
          <p className="text-sm text-gray-600 mt-1">
            View and manage voters who have registered through the public interface. These voters are loaded from the
            registered_voters.json file.
          </p>
        </div>

        <div className="p-4">
          {registeredVoters.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No voters registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Voter ID</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Username</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Date of Birth</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Location</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredVoters.map((voter) => (
                    <tr key={voter.voterID} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{voter.voterID}</td>
                      <td className="border border-gray-300 px-4 py-2">{voter.username}</td>
                      <td className="border border-gray-300 px-4 py-2">{voter.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{voter.email}</td>
                      <td className="border border-gray-300 px-4 py-2">{voter.dob}</td>
                      <td className="border border-gray-300 px-4 py-2">{voter.location}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          onClick={() => handleDelete(voter.voterID)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                          title="Delete registered voter"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Information Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-blue-800 font-semibold mb-2">Information</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Registered voters are loaded from the registered_voters.json file</li>
          <li>• Voter details (name, DOB, location) are fetched from the voters.json government database</li>
          <li>• Deleting a voter removes them from the registered_voters.json file</li>
          <li>• Voters can register themselves through the public registration interface</li>
        </ul>
      </div>
    </div>
  )
}
