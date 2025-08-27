// BlockchainExplorer.jsx

"use client"
import { useState, useEffect } from "react"
import React from "react"
import {
  ChevronDown,
  ChevronRight,
  Shield,
  Clock,
  Hash,
  Users,
  Vote,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import VotingApiService from "../services/api.js"
import Navbar from "../components/Navbar.jsx"
import Footer from "../components/Footer.jsx"
import { MerkleTree } from "../utils/merkle.js"

const BlockchainExplorer = () => {
  const [blocks, setBlocks] = useState([])
  const [expandedBlocks, setExpandedBlocks] = useState(new Set())
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [verificationResults, setVerificationResults] = useState(new Map())
  const [verifyingBlocks, setVerifyingBlocks] = useState(new Set())
  const [selectedTransactionProof, setSelectedTransactionProof] = useState(null)

  useEffect(() => {
    loadBlockchainData()
  }, [])

  const loadBlockchainData = async () => {
    try {
      setLoading(true)
      const response = await VotingApiService.getBlockchain()
      console.log("[v0] Blockchain API Response:", response)
      setBlocks(response || [])
    } catch (error) {
      console.error("Failed to load blockchain data:", error)
      setBlocks([])
    } finally {
      setLoading(false)
    }
  }

  const toggleBlockExpansion = (blockId) => {
    const newExpanded = new Set(expandedBlocks)
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId)
    } else {
      newExpanded.add(blockId)
    }
    setExpandedBlocks(newExpanded)
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case "VOTE":
        return <Vote className="w-4 h-4 text-blue-500" />
      case "ADD_CANDIDATE":
        return <Users className="w-4 h-4 text-green-500" />
      case "UPDATE_CANDIDATE":
        return <Users className="w-4 h-4 text-yellow-500" />
      case "REMOVE_CANDIDATE":
        return <Users className="w-4 h-4 text-red-500" />
      case "ADD_PARTY":
        return <Users className="w-4 h-4 text-purple-500" />
      case "UPDATE_PARTY":
        return <Users className="w-4 h-4 text-orange-500" />
      case "DELETE_PARTY":
        return <Users className="w-4 h-4 text-red-600" />
      case "START_ELECTION":
        return <Vote className="w-4 h-4 text-green-600" />
      case "STOP_ELECTION":
        return <Vote className="w-4 h-4 text-red-600" />
      default:
        return <Hash className="w-4 h-4 text-gray-500" />
    }
  }

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "VOTE":
        return "bg-blue-100 text-blue-800"
      case "ADD_CANDIDATE":
        return "bg-green-100 text-green-800"
      case "UPDATE_CANDIDATE":
        return "bg-yellow-100 text-yellow-800"
      case "REMOVE_CANDIDATE":
        return "bg-red-100 text-red-800"
      case "ADD_PARTY":
        return "bg-purple-100 text-purple-800"
      case "UPDATE_PARTY":
        return "bg-orange-100 text-orange-800"
      case "DELETE_PARTY":
        return "bg-red-100 text-red-800"
      case "START_ELECTION":
        return "bg-green-100 text-green-800"
      case "STOP_ELECTION":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatHash = (hash, length = 16) => {
    if (!hash) return ""
    return hash.length > length ? `${hash.substring(0, length)}...` : hash
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Invalid Date"
    try {
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString()
    } catch (error) {
      console.error("[v0] Date parsing error:", error, "for timestamp:", timestamp)
      return "Invalid Date"
    }
  }

  const parseTransactionPayload = (payload, type) => {
    switch (type) {
      case "ADD_CANDIDATE":
      case "UPDATE_CANDIDATE": {
        if (payload.includes(":")) {
          const parts = payload.split(":")
          if (parts.length >= 3) {
            return {
              name: parts[1],
              bio: parts.slice(2).join(":"),
            }
          }
        }
        return { action: payload }
      }
      case "VOTE":
        return { action: "Cast Vote" }
      case "ADD_PARTY":
      case "UPDATE_PARTY":
      case "DELETE_PARTY":
        return { action: payload }
      case "START_ELECTION":
      case "STOP_ELECTION":
        return { action: payload }
      default:
        return { raw: payload }
    }
  }

  const getTransactionType = (transaction) => {
    if (transaction.Type) return transaction.Type
    if (transaction.type) return transaction.type

    const payload = transaction.Payload || ""

    if (payload === "VOTE") return "VOTE"
    if (payload === "ADD_CANDIDATE") return "ADD_CANDIDATE"
    if (payload === "UPDATE_CANDIDATE") return "UPDATE_CANDIDATE"
    if (payload === "REMOVE_CANDIDATE") return "REMOVE_CANDIDATE"
    if (payload === "ADD_PARTY") return "ADD_PARTY"
    if (payload === "UPDATE_PARTY") return "UPDATE_PARTY"
    if (payload === "DELETE_PARTY") return "DELETE_PARTY"
    if (payload === "START_ELECTION") return "START_ELECTION"
    if (payload === "STOP_ELECTION") return "STOP_ELECTION"

    if (payload.startsWith("ADD_CANDIDATE:")) return "ADD_CANDIDATE"
    if (payload.startsWith("UPDATE_CANDIDATE:")) return "UPDATE_CANDIDATE"
    if (payload.startsWith("ADD_PARTY:")) return "ADD_PARTY"
    if (payload.startsWith("UPDATE_PARTY:")) return "UPDATE_PARTY"

    return "UNKNOWN"
  }

  const filteredBlocks = blocks.filter((block) => {
    if (filter === "votes") {
      return block.Transactions && block.Transactions.some((tx) => getTransactionType(tx) === "VOTE")
    }
    if (filter === "candidates") {
      return (
        block.Transactions &&
        block.Transactions.some((tx) => {
          const type = getTransactionType(tx)
          return type === "ADD_CANDIDATE" || type === "UPDATE_CANDIDATE" || type === "REMOVE_CANDIDATE"
        })
      )
    }
    if (filter === "parties") {
      return (
        block.Transactions &&
        block.Transactions.some((tx) => {
          const type = getTransactionType(tx)
          return type === "ADD_PARTY" || type === "UPDATE_PARTY" || type === "DELETE_PARTY"
        })
      )
    }
    if (filter === "elections") {
      return (
        block.Transactions &&
        block.Transactions.some((tx) => {
          const type = getTransactionType(tx)
          return type === "START_ELECTION" || type === "STOP_ELECTION"
        })
      )
    }
    return true
  })

  const searchFilteredBlocks = filteredBlocks.filter((block) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      (block.Hash && block.Hash.toLowerCase().includes(searchLower)) ||
      (block.Transactions &&
        block.Transactions.some(
          (tx) =>
            (tx.ID && tx.ID.toLowerCase().includes(searchLower)) ||
            (tx.Sender && tx.Sender.toLowerCase().includes(searchLower)) ||
            (tx.Receiver && tx.Receiver.toLowerCase().includes(searchLower)) ||
            (tx.Payload && tx.Payload.toLowerCase().includes(searchLower)),
        ))
    )
  })

  const verifyBlockIntegrity = async (block) => {
    const blockKey = `${block.Hash}-${block.Index}`
    setVerifyingBlocks((prev) => new Set([...prev, blockKey]))

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (!block.merkleRoot && !block.MerkleRoot) {
        console.log("[v0] Block has no Merkle root, calculating expected root for comparison")
        const { root: expectedRoot } = await MerkleTree.buildMerkleTreeAsync(block.Transactions || [])
        setVerificationResults(
          (prev) =>
            new Map([
              ...prev,
              [
                blockKey,
                {
                  isValid: false,
                  error: "Block missing Merkle root",
                  expectedRoot: expectedRoot,
                  message: "This block was created before Merkle root implementation",
                },
              ],
            ]),
        )
        return
      }

      const { root: calculatedRoot } = await MerkleTree.buildMerkleTreeAsync(block.Transactions || [])
      const storedRoot = block.merkleRoot || block.MerkleRoot
      const isValid = calculatedRoot === storedRoot

      console.log("[v0] Block verification:", {
        blockIndex: block.Index,
        calculatedRoot,
        storedRoot,
        isValid,
        transactions: block.Transactions?.map((tx) => ({
          id: tx.ID,
          hash: MerkleTree.hashTransactionAsync ? "async-method" : "sync-method",
        })),
      })

      setVerificationResults(
        (prev) =>
          new Map([
            ...prev,
            [
              blockKey,
              {
                isValid,
                calculatedRoot,
                storedRoot,
                block: block,
                transactions: block.Transactions || [],
                error: isValid ? null : `Merkle root mismatch\nExpected: ${calculatedRoot}\nActual: ${storedRoot}`,
              },
            ],
          ]),
      )
    } catch (error) {
      console.error("Verification failed:", error)
      setVerificationResults(
        (prev) =>
          new Map([
            ...prev,
            [
              blockKey,
              {
                isValid: false,
                error: "Verification failed: " + error.message,
              },
            ],
          ]),
      )
    } finally {
      setVerifyingBlocks((prev) => {
        const newSet = new Set(prev)
        newSet.delete(blockKey)
        return newSet
      })
    }
  }

  const verifyTransactionInclusion = async (block, transaction) => {
    try {
      const merkleRoot = block.merkleRoot || block.MerkleRoot
      if (!merkleRoot) {
        setSelectedTransactionProof({
          transaction,
          block,
          proof: null,
          isValid: false,
          error: "Block missing Merkle root - cannot verify transaction inclusion",
          merkleRoot: "N/A",
        })
        return
      }

      const proof = await MerkleTree.generateMerkleProofAsync(block.Transactions, transaction)
      const isValid = await MerkleTree.verifyMerkleProofAsync(transaction, proof, merkleRoot)

      console.log("[v0] Transaction verification:", {
        transactionId: transaction.ID,
        merkleRoot,
        proofLength: proof?.length || 0,
        isValid,
      })

      setSelectedTransactionProof({
        transaction,
        block,
        proof,
        isValid,
        merkleRoot,
      })
    } catch (error) {
      console.error("Transaction verification failed:", error)
      setSelectedTransactionProof({
        transaction,
        block,
        proof: null,
        isValid: false,
        error: "Verification failed: " + error.message,
      })
    }
  }

  const getVerificationIcon = (blockKey) => {
    if (verifyingBlocks.has(blockKey)) {
      return <AlertCircle className="w-4 h-4 text-yellow-500 animate-spin" />
    }

    const result = verificationResults.get(blockKey)
    if (!result) return null

    return result.isValid ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <div className="text-xl text-gray-600">Loading blockchain data...</div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Blockchain Explorer</h1>
            </div>
            <p className="text-gray-600">Transparent view of all transactions and blocks in the voting blockchain</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Hash className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{blocks.length}</h3>
                  <p className="text-gray-600">Total Blocks</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <Vote className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {blocks.reduce(
                      (sum, block) =>
                        sum +
                        (block.Transactions && Array.isArray(block.Transactions)
                          ? block.Transactions.filter((tx) => getTransactionType(tx) === "VOTE").length
                          : 0),
                      0,
                    )}
                  </h3>
                  <p className="text-gray-600">Total Votes</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {blocks.reduce(
                      (sum, block) =>
                        sum +
                        (block.Transactions && Array.isArray(block.Transactions)
                          ? block.Transactions.filter((tx) => getTransactionType(tx) === "ADD_CANDIDATE").length
                          : 0),
                      0,
                    )}
                  </h3>
                  <p className="text-gray-600">Candidates Added</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {blocks.length > 0 ? formatTimestamp(blocks[blocks.length - 1].Timestamp).split(",")[0] : "N/A"}
                  </h3>
                  <p className="text-gray-600">Last Block</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Blocks</option>
                  <option value="votes">Blocks with Votes</option>
                  <option value="candidates">Blocks with Candidate Changes</option>
                  <option value="parties">Blocks with Party Changes</option>
                  <option value="elections">Blocks with Election Management</option>
                </select>

                <button
                  onClick={loadBlockchainData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh
                </button>
              </div>

              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by hash, transaction ID, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Blockchain Visualization */}
          <div className="space-y-4">
            {searchFilteredBlocks.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No blocks found</h3>
                <p className="text-gray-500 mb-4">
                  {blocks.length === 0
                    ? "No blockchain data available. Please ensure your backend server is running on http://localhost:8080"
                    : "Try adjusting your search or filter criteria"}
                </p>
                {blocks.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4 text-left">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">Backend Connection Required</h4>
                    <p className="text-sm text-yellow-700">
                      The blockchain explorer requires a connection to your Go backend server. Please start your backend
                      server and ensure it's accessible at http://localhost:8080
                    </p>
                  </div>
                )}
              </div>
            ) : (
              searchFilteredBlocks.reverse().map((block, index) => {
                const blockId = `${block.Hash}-${block.Index}-${index}`
                const blockKey = `${block.Hash}-${block.Index}`
                return (
                  <div key={blockId} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Block Header */}
                    <div
                      className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleBlockExpansion(blockId)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {expandedBlocks.has(blockId) ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          )}
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Hash className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Block #{block.Index}</h3>
                          <p className="text-sm text-gray-500">
                            {formatTimestamp(block.Timestamp)} •{" "}
                            {block.Transactions && Array.isArray(block.Transactions) ? block.Transactions.length : 0}{" "}
                            transactions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 font-mono">Hash: {formatHash(block.Hash)}</div>
                        <div className="text-xs text-gray-500 font-mono">Prev: {formatHash(block.PrevHash)}</div>
                      </div>
                    </div>

                    {/* Block Details */}
                    {expandedBlocks.has(blockId) && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        {/* Block Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Block Hash</h4>
                            <p className="text-xs font-mono text-gray-600 break-all">{block.Hash}</p>
                          </div>
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Previous Hash</h4>
                            <p className="text-xs font-mono text-gray-600 break-all">{block.PrevHash}</p>
                          </div>
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Merkle Root</h4>
                            <p className="text-xs font-mono text-gray-600 break-all">
                              {block.merkleRoot || block.MerkleRoot || "N/A"}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Nonce: {block.nonce || block.Nonce || "N/A"}
                              </span>
                              <div className="flex items-center space-x-2">
                                {getVerificationIcon(blockKey)}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    verifyBlockIntegrity(block)
                                  }}
                                  disabled={verifyingBlocks.has(blockKey)}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50"
                                >
                                  {verifyingBlocks.has(blockKey) ? "Verifying..." : "Verify"}
                                </button>
                              </div>
                            </div>
                            {verificationResults.has(blockKey) && (
                              <div className="mt-2 p-2 rounded text-xs">
                                {verificationResults.get(blockKey).isValid ? (
                                  <div className="bg-green-50 text-green-700 border border-green-200 rounded p-2">
                                    ✓ Block integrity verified - Merkle root is valid
                                  </div>
                                ) : (
                                  <div className="bg-red-50 text-red-700 border border-red-200 rounded p-2">
                                    ✗{" "}
                                    {verificationResults.get(blockKey).error ||
                                      "Block integrity failed - Merkle root mismatch"}
                                    {verificationResults.get(blockKey).expectedRoot && (
                                      <div className="mt-1 text-xs">
                                        Expected: {verificationResults.get(blockKey).expectedRoot?.substring(0, 16)}...
                                      </div>
                                    )}
                                    {verificationResults.get(blockKey).message && (
                                      <div className="mt-1 text-xs text-orange-600">
                                        {verificationResults.get(blockKey).message}
                                      </div>
                                    )}
                                    {!verificationResults.get(blockKey).isValid &&
                                      verificationResults.get(blockKey).transactions &&
                                      verificationResults.get(blockKey).transactions.length > 0 && (
                                        <div className="mt-3">
                                          <HashComparison
                                            transaction={verificationResults.get(blockKey).transactions[0]}
                                            expectedHash={verificationResults.get(blockKey).storedRoot}
                                          />
                                          <GoJsonMatcher
                                            transaction={verificationResults.get(blockKey).transactions[0]}
                                            expectedHash={verificationResults.get(blockKey).storedRoot}
                                          />
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Transactions */}
                        {block.Transactions && Array.isArray(block.Transactions) && block.Transactions.length > 0 ? (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">
                              Transactions ({block.Transactions.length})
                            </h4>
                            <div className="space-y-3">
                              {block.Transactions.map((tx, txIndex) => {
                                const txType = getTransactionType(tx)
                                const parsedPayload = parseTransactionPayload(tx.Payload, txType)
                                return (
                                  <div
                                    key={`${tx.ID}-${txIndex}`}
                                    className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                                    onClick={() => setSelectedTransaction(tx)}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-3">
                                        {getTransactionIcon(txType)}
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(txType)}`}
                                        >
                                          {txType}
                                        </span>
                                        <span className="text-sm font-mono text-gray-600">{tx.ID}</span>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          verifyTransactionInclusion(block, tx)
                                        }}
                                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                      >
                                        Verify Inclusion
                                      </button>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                      <div>
                                        <span className="text-gray-600">From:</span>
                                        <span className="ml-2 font-mono text-gray-800">{tx.Sender}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">To:</span>
                                        <span className="ml-2 font-mono text-sm">{tx.Receiver}</span>
                                      </div>
                                    </div>

                                    {txType === "ADD_CANDIDATE" && (
                                      <div className="mt-2 text-sm">
                                        <span className="text-gray-600">Candidate:</span>
                                        <span className="ml-2 font-semibold">
                                          {parsedPayload.name || parsedPayload.action}
                                        </span>
                                      </div>
                                    )}
                                    {(txType === "ADD_PARTY" ||
                                      txType === "UPDATE_PARTY" ||
                                      txType === "DELETE_PARTY") && (
                                      <div className="mt-2 text-sm">
                                        <span className="text-gray-600">Party Action:</span>
                                        <span className="ml-2 font-semibold">{parsedPayload.action}</span>
                                        <span className="text-gray-600 ml-4">Target:</span>
                                        <span className="ml-2 font-mono text-sm">{tx.Receiver}</span>
                                      </div>
                                    )}
                                    {(txType === "START_ELECTION" || txType === "STOP_ELECTION") && (
                                      <div className="mt-2 text-sm">
                                        <span className="text-gray-600">Election Action:</span>
                                        <span className="ml-2 font-semibold">{parsedPayload.action}</span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Hash className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">No transactions in this block</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                <button onClick={() => setSelectedTransaction(null)} className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Transaction ID</label>
                  <p className="font-mono text-sm text-gray-600 bg-gray-100 p-2 rounded break-all">
                    {selectedTransaction.ID}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">From</label>
                    <p className="font-mono text-sm text-gray-600 bg-gray-100 p-2 rounded">
                      {selectedTransaction.Sender}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">To</label>
                    <p className="font-mono text-sm text-gray-600 bg-gray-100 p-2 rounded">
                      {selectedTransaction.Receiver}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Type</label>
                  <div className="mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getTransactionTypeColor(getTransactionType(selectedTransaction))}`}
                    >
                      {getTransactionType(selectedTransaction)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Payload</label>
                  <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded break-all">
                    {selectedTransaction.Payload}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedTransactionProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Merkle Proof</h3>
                <button onClick={() => setSelectedTransactionProof(null)} className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                {selectedTransactionProof.isValid ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-green-800 font-semibold">Transaction Successfully Verified</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      This transaction is cryptographically proven to be included in Block #
                      {selectedTransactionProof.block.Index}
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <XCircle className="w-5 h-5 text-red-500 mr-2" />
                      <span className="text-red-800 font-semibold">Transaction Verification Failed</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">
                      This transaction could not be verified as part of the block
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Transaction Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div>
                      <span className="text-xs text-gray-500">Transaction ID:</span>
                      <p className="font-mono text-xs break-all">{selectedTransactionProof.transaction.ID}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">From:</span>
                      <p className="font-mono text-xs">{selectedTransactionProof.transaction.Sender}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">To:</span>
                      <p className="font-mono text-xs">{selectedTransactionProof.transaction.Receiver}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Block Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div>
                      <span className="text-xs text-gray-500">Block Index:</span>
                      <p className="font-mono text-xs">#{selectedTransactionProof.block.Index}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Merkle Root:</span>
                      <p className="font-mono text-xs break-all">{selectedTransactionProof.merkleRoot}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Total Transactions:</span>
                      <p className="font-mono text-xs">{selectedTransactionProof.block.Transactions?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedTransactionProof.error && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">{selectedTransactionProof.error}</p>
                </div>
              )}

              {selectedTransactionProof.proof && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Merkle Proof Path</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-3">
                      The following hashes prove this transaction is included in the Merkle tree:
                    </p>
                    <div className="space-y-2">
                      {selectedTransactionProof.proof.map((step, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Step {index + 1}</span>
                          <span className="text-gray-600">{step.isLeft ? "Left:" : "Right:"}</span>
                          <span className="font-mono text-gray-800 break-all">{step.hash}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  )
}

export default BlockchainExplorer
