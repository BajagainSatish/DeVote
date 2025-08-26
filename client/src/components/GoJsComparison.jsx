"use client"

import { useState } from "react"
import React from "react"

const GoJsComparison = () => {
  const [results, setResults] = useState(null)

  const testTransaction = {
    ID: "36e30dcbccaff13a1086aa036c1b0bd751d026103b51ea6b8101ad22c625afdf",
    Sender: "admin",
    Receiver: "election",
    Payload: "START_ELECTION",
  }

  const expectedGoHash = "3e8e496b899482e05e04a1c4bfd01218640f49f2cf1e90f0b6c976fb0248f887"

  const sha256 = async (data) => {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  const testGoJsonFormats = async () => {
    const methods = [
      {
        name: "Go json.Marshal exact (no spaces)",
        format: () =>
          `{"ID":"${testTransaction.ID}","Payload":"${testTransaction.Payload}","Receiver":"${testTransaction.Receiver}","Sender":"${testTransaction.Sender}"}`,
        description: "Exact Go json.Marshal format with alphabetical keys",
      },
      {
        name: "Go json.Marshal with Type field",
        format: () =>
          `{"ID":"${testTransaction.ID}","Payload":"${testTransaction.Payload}","Receiver":"${testTransaction.Receiver}","Sender":"${testTransaction.Sender}","Type":""}`,
        description: "With empty Type field as in Go struct",
      },
      {
        name: "Raw transaction data (Go NewTransaction style)",
        format: () => testTransaction.Sender + testTransaction.Receiver + testTransaction.Payload,
        description: "How Go creates transaction ID: sender+receiver+payload",
      },
      {
        name: "Transaction ID only",
        format: () => testTransaction.ID,
        description: "Just the transaction ID itself",
      },
    ]

    const testResults = []

    for (const method of methods) {
      const jsonString = method.format()
      const hash = await sha256(jsonString)
      const matches = hash === expectedGoHash

      testResults.push({
        name: method.name,
        jsonString,
        hash,
        matches,
        description: method.description,
      })
    }

    setResults(testResults)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">Go vs JavaScript JSON Marshaling Comparison</h2>

      <section className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Test Transaction:</h3>
        <pre className="text-sm">{JSON.stringify(testTransaction, null, 2)}</pre>
      </section>

      <section className="bg-blue-50 p-4 rounded">
        <h3 className="font-semibold mb-2">Expected Go Hash:</h3>
        <code className="text-sm font-mono">{expectedGoHash}</code>
      </section>

      <button
        onClick={testGoJsonFormats}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Go JSON Formats
      </button>

      {results && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Results:</h3>
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded border ${result.matches ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">{result.name}</h4>
                <span
                  className={`px-2 py-1 rounded text-sm ${result.matches ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {result.matches ? "✓ MATCH" : "✗ No Match"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{result.description}</p>
              <div className="space-y-1">
                <div>
                  <strong>JSON:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{result.jsonString}</code>
                </div>
                <div>
                  <strong>Hash:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{result.hash}</code>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="bg-yellow-50 p-4 rounded">
        <h3 className="font-semibold mb-2">Analysis:</h3>
        <p className="text-sm">
          Go's <code>json.Marshal()</code> produces deterministic JSON with alphabetically sorted keys and no spaces.
          The exact format depends on the struct tags and field types. Check the browser console for detailed output.
        </p>
      </section>
    </div>
  )
}

export default GoJsComparison
