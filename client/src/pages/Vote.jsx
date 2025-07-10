import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UseAuth } from "../context/AuthContext";

const Vote = () => {
  const { username } = UseAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!username) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:8080/candidates")
      .then((res) => res.json())
      .then((data) => {
        const enriched = data.map((c, idx) => ({
          ...c,
          _internalKey: c.ID || `candidate-${idx}`, // fallback if ID is missing
        }));
        setCandidates(enriched);
      })
      .catch(() => setMessage("Failed to load candidates."));
  }, [username, navigate]);

  const handleVote = async () => {
    const token = localStorage.getItem("token");
    const payload = {
      voterId: username.replace("voter_", ""),
      candidateId: selectedId,
      name: "",
      dob: "",
    };

    try {
      const res = await fetch("http://localhost:8080/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Vote failed");
      setMessage("Vote cast successfully!");
    } catch (err) {
      setMessage(`${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F3F2] py-10 px-6">
      <h1 className="text-3xl font-bold text-center mb-6">Vote for Your Candidate</h1>

      {message && (
        <div className="text-center font-semibold text-red-500 mb-4">{message}</div>
      )}

      <div className="max-w-xl mx-auto grid gap-4">
        {candidates.map((c) => (
          <div
            key={c._internalKey}
            onClick={() => setSelectedId(c.ID)}
            className={`p-4 rounded-md border transition duration-200 cursor-pointer shadow-sm hover:shadow-md ${
              selectedId === c.ID ? "border-[#21978B] bg-[#e6f6f4]" : "border-gray-300 bg-white"
            }`}
          >
            <h2 className="text-xl font-semibold text-gray-800">{c.Name}</h2>
            <p className="text-gray-600 mt-1">{c.Bio}</p>
            {selectedId === c.ID && (
              <p className="text-sm text-[#21978B] font-medium mt-2">Selected</p>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-6">
        <button
          onClick={handleVote}
          disabled={!selectedId}
          className={`bg-[#21978B] text-white px-6 py-2 rounded-md font-semibold transition ${
            !selectedId ? "opacity-50 cursor-not-allowed" : "hover:bg-[#19796e]"
          }`}
        >
          Submit Vote
        </button>
      </div>
    </div>
  );
};

export default Vote;
