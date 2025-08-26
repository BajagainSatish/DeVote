// devote-admin/pages/Admin/AddCandidate.jsx

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import apiService from "../../services/api";

export default function AddCandidate() {
  const [formData, setFormData] = useState({
    name: "",
    id: "",
    partyId: "",
    age: "",
    imageUrl: "",
    bio: "",
    region: "",
  });
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [partiesLoading, setPartiesLoading] = useState(true);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const data = await apiService.getParties();
      setParties(data || []);
    } catch (error) {
      toast.error("Failed to fetch parties" + error);
    } finally {
      setPartiesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setFormData((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Candidate name is required.");
      return;
    }
    if (!formData.id.trim()) {
      toast.error("Candidate ID is required.");
      return;
    }

    setLoading(true);

    try {
      await apiService.addCandidate(formData);
      toast.success(`Candidate "${formData.name}" added successfully!`);
      
      // Reset form
      setFormData({
        name: "",
        id: "",
        partyId: "",
        age: "",
        imageUrl: "",
        bio: "",
        region: "",
      });
    } catch (error) {
      toast.error(error.message || "Failed to add candidate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <form
        onSubmit={handleAdd}
        className="bg-white w-full max-w-xl p-8 rounded-xl shadow-md"
        encType="multipart/form-data"
      >
        <h2 className="text-2xl font-bold text-[#21978B] mb-6 text-center">
          Add New Candidate
        </h2>
        
        <label className="block font-semibold mb-1 text-gray-800">Name</label>
        <input
          type="text"
          name="name"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#18BC9C]"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter candidate name"
          required
          disabled={loading}
        />

        <label className="block font-semibold mb-1 text-gray-800">ID</label>
        <input
          type="text"
          name="id"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#18BC9C]"
          value={formData.id}
          onChange={handleChange}
          placeholder="Enter candidate ID"
          required
          disabled={loading}
        />

        <label className="block font-semibold mb-1 text-gray-800">Party</label>
        <select
          name="partyId"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#18BC9C]"
          value={formData.partyId}
          onChange={handleChange}
          disabled={loading || partiesLoading}
        >
          <option value="">Select Party (Optional)</option>
          {parties.map((party) => (
            <option key={party.id} value={party.id}>
              {party.name}
            </option>
          ))}
        </select>

        <label className="block font-semibold mb-1 text-gray-800">Age</label>
        <input
          type="number"
          name="age"
          min="18"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#18BC9C]"
          value={formData.age}
          onChange={handleChange}
          placeholder="Enter candidate age"
          disabled={loading}
        />

        <label className="block font-semibold mb-1 text-gray-800">Image URL (Optional)</label>
        <input
          type="url"
          name="imageUrl"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#18BC9C]"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
          disabled={loading}
        />

        <label className="block font-semibold mb-1 text-gray-800">Bio</label>
        <textarea
          name="bio"
          rows="4"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#18BC9C]"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Enter short biography"
          disabled={loading}
        ></textarea>

        <button
          type="submit"
          className="w-full bg-[#21978B] hover:bg-[#18BC9C] text-white font-semibold py-2 rounded transition duration-200 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Candidate"}
        </button>
      </form>
    </div>
  );
}