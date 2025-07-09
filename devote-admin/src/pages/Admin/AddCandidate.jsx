import { useState } from "react";
import { toast } from "react-toastify";

export default function AddCandidate() {
  const [formData, setFormData] = useState({
    name: "",
    id: "",
    party: "",
    age: "",
    photo: null,
    bio: "",
    region: "",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setFormData((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Candidate name is required.");
      return;
    }
    if (!formData.id.trim()) {
      toast.error("Candidate ID is required.");
      return;
    }
    //Ya backend integrate garne ani db ma save garne
    toast.success(
      `Candidate "${formData.name}" added successfully (simulated)!`
    );
    setFormData({
      name: "",
      id: "",
      party: "",
      age: "",
      photo: null,
      bio: "",
      region: "",
    });
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
        />

        <label className="block font-semibold mb-1 text-gray-800">Party</label>
        <input
          type="text"
          name="party"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#18BC9C]"
          value={formData.party}
          onChange={handleChange}
          placeholder="Enter party name"
        />

        <label className="block font-semibold mb-1 text-gray-800">Age</label>
        <input
          type="number"
          name="age"
          min="18"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#18BC9C]"
          value={formData.age}
          onChange={handleChange}
          placeholder="Enter candidate age"
        />

        <label className="block font-semibold mb-1 text-gray-800">Photo</label>
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="w-full mb-4 rounded border border-gray-300 px-3 py-2 cursor-pointer
             bg-white text-gray-700 hover:border-[#18BC9C] focus:outline-none
             focus:ring-2 focus:ring-[#18BC9C] transition"
          onChange={handleChange}
        />

        <label className="block font-semibold mb-1 text-gray-800">Bio</label>
        <textarea
          name="bio"
          rows="4"
          className="w-full border border-gray-300 rounded px-4 py-2 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#18BC9C]"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Enter short biography"
        ></textarea>

        <button
          type="submit"
          className="w-full bg-[#21978B] hover:bg-[#18BC9C] text-white font-semibold py-2 rounded transition duration-200"
        >
          Add Candidate
        </button>
      </form>
    </div>
  );
}
