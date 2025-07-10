import { useState } from "react";

export default function ViewCandidates() {
  const [candidates, setCandidates] = useState([
    {
      name: "Satish Hero",
      id: "C001",
      party: "Maoist Party",
      age: 22,
      region: "Kathmandu",
      photo:
        "https://cdn.pixabay.com/photo/2012/10/26/01/39/fidel-alejandro-castro-ruz-63039_1280.jpg",
      bio: "IM choose garne ho, Ko SPM padhxa",
    },
    {
      name: "Shreeya Palikhel",
      id: "C002",
      party: "Nepali Congress",
      age: 20,
      region: "Bhaktapur",
      photo: null,
      bio: "J padheni vayo sathiharu",
    },
  ]);

  const handleDelete = (index) => {
    const updated = candidates.filter((_, i) => i !== index);
    setCandidates(updated);
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4">
      <div className="bg-white w-full max-w-5xl p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-[#21978B] mb-6 text-center">
          All Candidates
        </h2>

        {candidates.length === 0 ? (
          <p className="text-center text-gray-600">No candidates available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidates.map((candidate, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                {candidate.photo && (
                  <img
                    // src={URL.createObjectURL(candidate.photo)}
                    src={candidate.photo}
                    alt={candidate.name}
                    className="w-full h-48 object-cover rounded mb-3"
                  />
                )}

                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  {candidate.name}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>ID:</strong> {candidate.id}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Party:</strong> {candidate.party}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Age:</strong> {candidate.age}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Region:</strong> {candidate.region}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  <strong>Bio:</strong> {candidate.bio}
                </p>

                <button
                  onClick={() => handleDelete(index)}
                  className="bg-red-500 text-white px-4 py-1.5 rounded hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
