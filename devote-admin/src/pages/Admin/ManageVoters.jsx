import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import apiService from "../../services/api";

export default function ManageVoters() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data || []);
    } catch (error) {
      toast.error("Failed to fetch users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await apiService.updateUser(editingUser.userId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      });
      toast.success("User updated successfully");
      
      fetchUsers();
      resetForm();
    } catch (error) {
      toast.error(error.message || "Update failed");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
    });
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const resetForm = () => {
    setFormData({ userId: "", name: "", email: "", phone: "", address: "" });
    setEditingUser(null);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#21978B]">Manage Voters</h2>
        <div className="text-sm text-gray-600">
          Total Voters: {users.length}
        </div>
      </div>

      {editingUser && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">Edit Voter Information</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">User ID</label>
              <input
                type="text"
                name="userId"
                value={formData.userId}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                disabled
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter phone number"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter address"
                rows="2"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                Update Voter
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
          <h3 className="text-lg font-semibold">Registered Voters</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage existing voter information. Voters register themselves through the public interface.
          </p>
        </div>
        <div className="p-4">
          {users.length === 0 ? (
            <p className="text-gray-600 text-center">No voters registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">User ID</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Phone</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Voting Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.userId} className={user.hasVoted ? "bg-green-50" : ""}>
                      <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                        {user.userId}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                      <td className="border border-gray-300 px-4 py-2">{user.phone || "N/A"}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.hasVoted
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.hasVoted ? "Voted" : "Pending"}
                        </span>
                        {user.hasVoted && user.votedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(user.votedAt).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.userId)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                            disabled={user.hasVoted}
                            title={user.hasVoted ? "Cannot delete user who has voted" : "Delete user"}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}