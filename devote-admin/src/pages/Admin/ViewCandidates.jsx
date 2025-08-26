// devote-admin/pages/Admin/ViewCandidates.jsx

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import apiService from "../../services/api";

export default function ViewCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    bio: "",
    partyId: "",
    age: "",
    imageUrl: "",
  });
  const [parties, setParties] = useState([]);
  
  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchCandidates = async () => {
    try {
      const data = await apiService.getCandidates();
      setCandidates(data || []);
    } catch (error) {
      toast.error("Failed to fetch candidates");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (candidateId) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) {
      return;
    }

    setDeleteLoading(candidateId);
    
    try {
      await apiService.deleteCandidate(candidateId);
      setCandidates(prev => prev.filter(c => c.candidateId !== candidateId));
      toast.success("Candidate deleted successfully");
    } catch (error) {
      toast.error(error.message || "Failed to delete candidate");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (candidate) => {
    setEditingCandidate(candidate.candidateId);
    setEditFormData({
      name: candidate.name,
      bio: candidate.bio,
      partyId: candidate.partyId || "",
      age: candidate.age || "",
      imageUrl: candidate.imageUrl || "",
    });
  };

  const handleEditSubmit = async (candidateId) => {
    try {
      await apiService.updateCandidate(candidateId, editFormData);
      
      // Update local state
      setCandidates(prev => 
        prev.map(c => 
          c.candidateId === candidateId 
            ? { ...c, ...editFormData, age: parseInt(editFormData.age) || 0 }
            : c
        )
      );
      
      setEditingCandidate(null);
      toast.success("Candidate updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update candidate");
    }
  };

  const handleEditCancel = () => {
    setEditingCandidate(null);
    setEditFormData({ name: "", bio: "", party: "", age: "", imageUrl: "" });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper function to get image source
  const getImageSrc = (candidate) => {
    if (candidate.imageUrl) {
      return candidate.imageUrl;
    }
    // Fallback to a placeholder image
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&size=200&background=21978B&color=ffffff`;
  };

  const fetchParties = async () => {
    try {
      const data = await apiService.getParties();
      setParties(data || []);
    } catch (error) {
      console.error("Failed to fetch parties" + error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-lg text-gray-600">Loading candidates...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4">
      <div className="bg-white w-full max-w-6xl p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-[#21978B] mb-6 text-center">
          All Candidates
        </h2>
        
        {candidates.length === 0 ? (
          <p className="text-center text-gray-600">No candidates available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div
                key={candidate.candidateId}
                className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                {editingCandidate === candidate.candidateId ? (
                  // Edit Form
                  <div className="space-y-3">
                    {/* Image Preview in Edit Mode */}
                    <div className="flex flex-col items-center mb-4">
                      <img
                        src={editFormData.imageUrl || getImageSrc({ name: editFormData.name, imageUrl: editFormData.imageUrl })}
                        alt={editFormData.name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(editFormData.name || 'User')}&size=200&background=21978B&color=ffffff`;
                        }}
                      />
                      <input
                        type="url"
                        name="imageUrl"
                        value={editFormData.imageUrl}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-2"
                        placeholder="Image URL"
                      />
                    </div>
                    
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="Name"
                    />
                    <select
                      name="partyId"
                      value={editFormData.partyId}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select Party (Optional)</option>
                      {parties.map((party) => (
                        <option key={party.id} value={party.id}>
                          {party.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="age"
                      value={editFormData.age}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="Age"
                    />
                    <textarea
                      name="bio"
                      value={editFormData.bio}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
                      rows="3"
                      placeholder="Bio"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSubmit(candidate.candidateId)}
                        className="bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <>
                    {/* Candidate Image */}
                    <div className="flex flex-col items-center mb-4">
                      <img
                        src={getImageSrc(candidate) || "/placeholder.svg"}
                        alt={candidate.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-[#21978B] shadow-lg"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&size=200&background=21978B&color=ffffff`;
                        }}
                      />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                      {candidate.name}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p><strong>ID:</strong> {candidate.candidateId}</p>
                      <p><strong>Party:</strong> {candidate.partyName || "Independent"}</p>
                      <p><strong>Age:</strong> {candidate.age || "N/A"}</p>
                      <p><strong>Votes:</strong> <span className="font-semibold text-[#21978B]">{candidate.votes}</span></p>
                      <p><strong>Bio:</strong> {candidate.bio}</p>
                    </div>
                    
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(candidate)}
                        className="bg-blue-500 text-white px-4 py-1.5 rounded hover:bg-blue-600 transition text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(candidate.candidateId)}
                        className="bg-red-500 text-white px-4 py-1.5 rounded hover:bg-red-600 transition disabled:opacity-50 text-sm"
                        disabled={deleteLoading === candidate.candidateId}
                      >
                        {deleteLoading === candidate.candidateId ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}