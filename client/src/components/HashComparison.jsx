import { sha256 } from "js-sha256"
import React from "react"

export default function HashComparison({ transaction, expectedHash }) {

  // Method 1: Current implementation (sorted object with JSON.stringify)
  const method1 = () => {
    const sortedTx = {
      ID: transaction.ID,
      Sender: transaction.Sender,
      Receiver: transaction.Receiver,
      Payload: transaction.Payload,
      Type: transaction.Type || "",
    }
    const data = JSON.stringify(sortedTx)
    console.log("[v0] Method 1 JSON:", data)
    return sha256(data)
  }

  // Method 2: Go-style JSON (alphabetical keys like Go's json.Marshal)
  const method2 = () => {
    const sortedTx = {
      ID: transaction.ID,
      Payload: transaction.Payload,
      Receiver: transaction.Receiver,
      Sender: transaction.Sender,
      Type: transaction.Type || "",
    }
    const data = JSON.stringify(sortedTx)
    console.log("[v0] Method 2 JSON:", data)
    return sha256(data)
  }

  // Method 3: Go-style JSON without Type field
  const method3 = () => {
    const sortedTx = {
      ID: transaction.ID,
      Payload: transaction.Payload,
      Receiver: transaction.Receiver,
      Sender: transaction.Sender,
    }
    const data = JSON.stringify(sortedTx)
    console.log("[v0] Method 3 JSON:", data)
    return sha256(data)
  }

  // Method 4: Manual JSON string (exactly like Go might produce)
  const method4 = () => {
    const data = `{"ID":"${transaction.ID}","Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}","Type":"${transaction.Type || ""}"}`
    console.log("[v0] Method 4 JSON:", data)
    return sha256(data)
  }

  // Method 5: Manual JSON without Type
  const method5 = () => {
    const data = `{"ID":"${transaction.ID}","Payload":"${transaction.Payload}","Receiver":"${transaction.Receiver}","Sender":"${transaction.Sender}"}`
    console.log("[v0] Method 5 JSON:", data)
    return sha256(data)
  }

  // Method 6: Try different field order (ISPR)
  const method6 = () => {
    const sortedTx = {
      ID: transaction.ID,
      Sender: transaction.Sender,
      Payload: transaction.Payload,
      Receiver: transaction.Receiver,
    }
    const data = JSON.stringify(sortedTx)
    console.log("[v0] Method 6 JSON:", data)
    return sha256(data)
  }

  // Method 7: Try with Timestamp field (common in blockchain)
  const method7 = () => {
    const sortedTx = {
      ID: transaction.ID,
      Payload: transaction.Payload,
      Receiver: transaction.Receiver,
      Sender: transaction.Sender,
      Timestamp: transaction.Timestamp || "",
    }
    const data = JSON.stringify(sortedTx)
    console.log("[v0] Method 7 JSON:", data)
    return sha256(data)
  }

  // Method 8: Try with all possible fields from Go struct
  const method8 = () => {
    const sortedTx = {
      ID: transaction.ID,
      From: transaction.From || transaction.Sender,
      To: transaction.To || transaction.Receiver,
      Data: transaction.Data || transaction.Payload,
      Value: transaction.Value || 0,
      Timestamp: transaction.Timestamp || 0,
    }
    const data = JSON.stringify(sortedTx)
    console.log("[v0] Method 8 JSON:", data)
    return sha256(data)
  }

  // Method 9: Try hashing just the transaction ID (maybe Go uses ID as hash?)
  const method9 = () => {
    const data = transaction.ID
    console.log("[v0] Method 9 data:", data)
    return sha256(data)
  }

  // Method 10: Try double hashing (hash of hash)
  const method10 = () => {
    const sortedTx = {
      ID: transaction.ID,
      Payload: transaction.Payload,
      Receiver: transaction.Receiver,
      Sender: transaction.Sender,
    }
    const data = JSON.stringify(sortedTx)
    const firstHash = sha256(data)
    console.log("[v0] Method 10 first hash:", firstHash)
    return sha256(firstHash)
  }

  // Method 11: Try with hex encoding of JSON
const method11 = () => {
  const sortedTx = {
    ID: transaction.ID,
    Payload: transaction.Payload,
    Receiver: transaction.Receiver,
    Sender: transaction.Sender,
  }
  const data = JSON.stringify(sortedTx)
  const hexData = Array.from(new TextEncoder().encode(data))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")
  console.log("[v0] Method 11 hex data:", hexData)
  return sha256(hexData)
}

  // Method 12: Try with base64 encoding
  const method12 = () => {
    const sortedTx = {
      ID: transaction.ID,
      Payload: transaction.Payload,
      Receiver: transaction.Receiver,
      Sender: transaction.Sender,
    }
    const data = JSON.stringify(sortedTx)
    const base64Data = btoa(data)
    console.log("[v0] Method 12 base64 data:", base64Data)
    return sha256(base64Data)
  }

  const methods = [
    { name: "Method 1: Current (ISRPT order)", hash: method1(), match: method1() === expectedHash },
    { name: "Method 2: Go-style (IPRST alphabetical)", hash: method2(), match: method2() === expectedHash },
    { name: "Method 3: Go-style no Type", hash: method3(), match: method3() === expectedHash },
    { name: "Method 4: Manual JSON with Type", hash: method4(), match: method4() === expectedHash },
    { name: "Method 5: Manual JSON no Type", hash: method5(), match: method5() === expectedHash },
    { name: "Method 6: ISPR order", hash: method6(), match: method6() === expectedHash },
    { name: "Method 7: With Timestamp", hash: method7(), match: method7() === expectedHash },
    { name: "Method 8: Go struct fields", hash: method8(), match: method8() === expectedHash },
    { name: "Method 9: Just transaction ID", hash: method9(), match: method9() === expectedHash },
    { name: "Method 10: Double hash", hash: method10(), match: method10() === expectedHash },
    { name: "Method 11: Hex encoded JSON", hash: method11(), match: method11() === expectedHash },
    { name: "Method 12: Base64 encoded JSON", hash: method12(), match: method12() === expectedHash },
  ]

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Hash Comparison Test</h3>
      <div className="mb-4">
        <p>
          <strong>Transaction:</strong>
        </p>
        <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
          {JSON.stringify(transaction, null, 2)}
        </pre>
        <p className="mt-2">
          <strong>Expected Hash (Go):</strong>
        </p>
        <code className="bg-gray-200 px-2 py-1 rounded text-xs break-all">{expectedHash}</code>
      </div>

      <div className="space-y-2">
        {methods.map((method, index) => (
          <div
            key={index}
            className={`p-3 rounded border ${method.match ? "bg-green-100 border-green-300" : "bg-red-50 border-red-200"}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{method.name}</span>
              {method.match && <span className="text-green-600 font-bold">✓ MATCH!</span>}
            </div>
            <code className="text-xs text-gray-600 break-all block mt-1">{method.hash}</code>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Debug Information</h4>
        <p className="text-sm text-blue-700 mb-2">
          None of the methods match the Go hash. This suggests the Go backend might be:
        </p>
        <ul className="text-xs text-blue-600 space-y-1 ml-4">
          <li>• Using a different transaction structure or field names</li>
          <li>• Including additional fields not visible in the frontend</li>
          <li>• Using a different hashing algorithm or encoding</li>
          <li>• Processing the transaction data differently before hashing</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          Check the browser console for detailed JSON strings being hashed by each method.
        </p>
      </div>
    </div>
  )
}
