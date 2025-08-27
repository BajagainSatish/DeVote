"use client"

import { useState } from "react"
import { sha256 } from "js-sha256"
import React from "react"

const GoJsonMatcher = ({ transaction, expectedHash }) => {
  const [results, setResults] = useState([])

  const testGoJsonFormats = async () => {
    const results = []

    // Test different possible Go struct field combinations
    const testCases = [
      // Case 1: Basic 4 fields (ID, Payload, Receiver, Sender) - alphabetical
      {
        name: "Basic 4 fields (alphabetical)",
        json: `{"ID":"${transaction.ID}","Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}"}`,
      },

      // Case 2: With empty Type field
      {
        name: "With empty Type field",
        json: `{"ID":"${transaction.ID}","Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}","Type":""}`,
      },

      // Case 3: With Type field matching Payload
      {
        name: "With Type field = Payload",
        json: `{"ID":"${transaction.ID}","Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}","Type":"${transaction.Payload}"}`,
      },

      // Case 4: With Timestamp field (Unix timestamp)
      {
        name: "With Timestamp (Unix)",
        json: `{"ID":"${transaction.ID}","Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}","Timestamp":1735264227}`,
      },

      // Case 5: With both Type and Timestamp
      {
        name: "With Type and Timestamp",
        json: `{"ID":"${transaction.ID}","Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}","Timestamp":1735264227,"Type":"${transaction.Payload}"}`,
      },

      // Case 6: Different field order (as Go might marshal)
      {
        name: "Different field order",
        json: `{"Sender":"${transaction.Sender}","Receiver":"${transaction.Receiver}","Payload":"${transaction.Payload}","ID":"${transaction.ID}"}`,
      },

      // Case 7: With Amount field (common in blockchain)
      {
        name: "With Amount field",
        json: `{"Amount":0,"ID":"${transaction.ID}","Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}"}`,
      },

      // Case 8: With Nonce field
      {
        name: "With Nonce field",
        json: `{"ID":"${transaction.ID}","Nonce":0,"Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}"}`,
      },

      // Case 9: With BlockHash field
      {
        name: "With BlockHash field",
        json: `{"BlockHash":"","ID":"${transaction.ID}","Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}"}`,
      },

      // Case 10: With Index field
      {
        name: "With Index field",
        json: `{"ID":"${transaction.ID}","Index":0,"Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}"}`,
      },

      // Case 11: All possible fields
      {
        name: "All possible fields",
        json: `{"Amount":0,"BlockHash":"","ID":"${transaction.ID}","Index":0,"Nonce":0,"Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}","Timestamp":1735264227,"Type":"${transaction.Payload}"}`,
      },

      // Case 12: Try with different timestamp
      {
        name: "With different timestamp",
        json: `{"ID":"${transaction.ID}","Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}","Timestamp":0}`,
      },
    ]

    for (const testCase of testCases) {
      const hash = sha256(testCase.json)
      const isMatch = hash === expectedHash

      results.push({
        name: testCase.name,
        json: testCase.json,
        hash: hash,
        isMatch: isMatch,
      })

      console.log(`[v0] ${testCase.name}: ${testCase.json} -> ${hash}`)
    }

    setResults(results)
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Go JSON Format Matcher</h3>

      <div className="mb-4">
        <p className="text-sm text-gray-600">Transaction: {JSON.stringify(transaction)}</p>
        <p className="text-sm text-gray-600">Expected Hash: {expectedHash}</p>
      </div>

      <button onClick={testGoJsonFormats} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4">
        Test Go JSON Formats
      </button>

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Results:</h4>
          {results.map((result, index) => (
            <div key={index} className={`p-2 rounded ${result.isMatch ? "bg-green-100" : "bg-red-50"}`}>
              <div className="flex items-center gap-2">
                <span className={result.isMatch ? "text-green-600" : "text-red-600"}>{result.isMatch ? "✓" : "✗"}</span>
                <span className="font-medium">{result.name}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">JSON: {result.json}</div>
              <div className="text-xs text-gray-600">Hash: {result.hash}</div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && !results.some((r) => r.isMatch) && (
        <div className="mt-4 p-3 bg-yellow-100 rounded">
          <p className="text-sm text-yellow-800">
            <strong>No matches found!</strong> The Go backend might be using:
          </p>
          <ul className="text-xs text-yellow-700 mt-2 list-disc list-inside">
            <li>Different field names or types</li>
            <li>Additional hidden fields</li>
            <li>Different JSON marshaling rules</li>
            <li>Custom serialization logic</li>
            <li>Different timestamp or nonce values</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default GoJsonMatcher
