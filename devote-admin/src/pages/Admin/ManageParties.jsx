// devote-admin/pages/Admin/ManageParties.jsx

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import apiService from "../../services/api";

export default function ManageParties() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    color: "#21978B",
  });

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    setLoading(true); // Add this line
    try {
      const data = await apiService.getParties();
      console.log("Fetched parties:", data); // Add for debugging
      setParties(data || []);
    } catch (error) {
      console.error("Error fetching parties:", error); // Add for debugging
      toast.error("Failed to fetch parties");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingParty) {
        await apiService.updateParty(editingParty.id, {
          name: formData.name,
          description: formData.description,
          color: formData.color,
        });
        toast.success("Party updated successfully");
      } else {
        await apiService.addParty(formData);
        toast.success("Party added successfully");
      }
      
      fetchParties();
      resetForm();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleEdit = (party) => {
    setEditingParty(party);
    setFormData({
      id: party.id,
      name: party.name,
      description: party.description,
      color: party.color,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (partyId) => {
    if (!window.confirm("Are you sure you want to delete this party?")) {
      return;
    }

    try {
      await apiService.deleteParty(partyId);
      toast.success("Party deleted successfully");
      fetchParties();
    } catch (error) {
      toast.error(error.message || "Failed to delete party");
    }
  };

  const resetForm = () => {
    setFormData({ id: "", name: "", description: "", color: "#21978B" });
    setShowAddForm(false);
    setEditingParty(null);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-lg text-gray-600">Loading parties...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#21978B]">Manage Parties</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#21978B] text-white px-4 py-2 rounded hover:bg-[#18BC9C] transition"
        >
          Add New Party
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingParty ? "Edit Party" : "Add New Party"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Party ID</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter party ID"
                required
                disabled={editingParty}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Party Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter party name"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Color</label>
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 h-10"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter party description"
                rows="2"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                {editingParty ? "Update" : "Add"} Party
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Existing Parties</h3>
        </div>
        <div className="p-4">
          {parties.length === 0 ? (
            <p className="text-gray-600 text-center">No parties available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parties.map((party) => (
                <div
                  key={party.id}
                  className="border border-gray-200 rounded-lg p-4"
                  style={{ borderLeftColor: party.color, borderLeftWidth: '4px' }}
                >
                  <h4 className="font-semibold text-lg">{party.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">ID: {party.id}</p>
                  <p className="text-sm text-gray-700 mb-3">{party.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(party)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(party.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}