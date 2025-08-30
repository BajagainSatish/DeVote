"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./common/Card"
import { Button } from "./common/Button"
import { Badge } from "./common/Badge"
import { RefreshCw, Database, CheckCircle, XCircle, Zap, AlertTriangle, Shield } from "lucide-react"

export function BlockchainMonitor({ nodes, onNodesUpdate }) {
  const [blockchainData, setBlockchainData] = useState({})
  const [selectedNode, setSelectedNode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [blockCounter, setBlockCounter] = useState(3)

  // Generate initial mock blockchain data based on node status
  const initializeMockBlockchains = () => {
    const mockData = {}
    const baseTimestamp = Date.now() - 600000 // 10 minutes ago

    nodes.forEach(node => {
      if (node.status === "inactive") return

      const blocks = []
      
      // Genesis block (same for all)
      blocks.push({
        Index: 0,
        Hash: "0000a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12",
        PrevHash: "genesis",
        Timestamp: new Date(baseTimestamp).toISOString(),
        Transactions: [],
        MerkleRoot: "genesis_merkle_root",
        Validator: "genesis"
      })

      // Block 1 (same for all honest nodes)
      const block1Txs = [
        {
          ID: "tx_001",
          Sender: "voter_001",
          Receiver: "candidate_1",
          Payload: "VOTE",
          Timestamp: new Date(baseTimestamp + 120000).toISOString()
        },
        {
          ID: "tx_002", 
          Sender: "voter_002",
          Receiver: "candidate_2",
          Payload: "VOTE",
          Timestamp: new Date(baseTimestamp + 125000).toISOString()
        }
      ]

      blocks.push({
        Index: 1,
        Hash: "0001b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234",
        PrevHash: blocks[0].Hash,
        Timestamp: new Date(baseTimestamp + 180000).toISOString(),
        Transactions: block1Txs,
        MerkleRoot: "merkle_root_block_1",
        Validator: node.id
      })

      // Block 2 - This is where Byzantine behavior starts to show
      if (node.status === "malicious") {
        // Malicious node: different transactions or corrupted data
        const maliciousBlock2Txs = [
          {
            ID: "tx_mal_003",
            Sender: "voter_003",
            Receiver: "candidate_1", // Malicious: voting for different candidate
            Payload: "VOTE",
            Timestamp: new Date(baseTimestamp + 240000).toISOString()
          },
          {
            ID: "tx_mal_004",
            Sender: "voter_003", // Malicious: double voting
            Receiver: "candidate_3",
            Payload: "VOTE", 
            Timestamp: new Date(baseTimestamp + 245000).toISOString()
          },
          {
            ID: "tx_fake_005", // Malicious: fake transaction
            Sender: "fake_voter",
            Receiver: "candidate_1",
            Payload: "FAKE_VOTE",
            Timestamp: new Date(baseTimestamp + 250000).toISOString()
          }
        ]

        blocks.push({
          Index: 2,
          Hash: "0002MALICIOUS456789012345678901234567890abcdef1234567890abcdef", // Different hash
          PrevHash: blocks[1].Hash,
          Timestamp: new Date(baseTimestamp + 300000).toISOString(),
          Transactions: maliciousBlock2Txs,
          MerkleRoot: "malicious_merkle_root",
          Validator: node.id
        })
      } else {
        // Honest node: legitimate transactions
        const honestBlock2Txs = [
          {
            ID: "tx_003",
            Sender: "voter_003",
            Receiver: "candidate_2",
            Payload: "VOTE",
            Timestamp: new Date(baseTimestamp + 240000).toISOString()
          },
          {
            ID: "tx_004",
            Sender: "voter_004", 
            Receiver: "candidate_1",
            Payload: "VOTE",
            Timestamp: new Date(baseTimestamp + 245000).toISOString()
          }
        ]

        blocks.push({
          Index: 2,
          Hash: "0002c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
          PrevHash: blocks[1].Hash,
          Timestamp: new Date(baseTimestamp + 300000).toISOString(),
          Transactions: honestBlock2Txs,
          MerkleRoot: "honest_merkle_root_block_2",
          Validator: "consensus"
        })
      }

      mockData[node.id] = blocks
    })

    setBlockchainData(mockData)
    if (!selectedNode && Object.keys(mockData).length > 0) {
      setSelectedNode(Object.keys(mockData)[0])
    }
  }

  // Add a new block when test vote is submitted
  const addNewBlock = (isFromConsensus = false) => {
    const newBlockchainData = { ...blockchainData }
    const timestamp = new Date().toISOString()
    setBlockCounter(prev => prev + 1)

    Object.keys(newBlockchainData).forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId)
      if (!node || node.status === "inactive") return

      const currentBlocks = newBlockchainData[nodeId]
      const lastBlock = currentBlocks[currentBlocks.length - 1]
      
      if (node.status === "malicious" && Math.random() < 0.7) {
        // Malicious node: corrupt the block or add fake transactions
        const maliciousTransactions = [
          {
            ID: `tx_mal_${nodeId}_${blockCounter}_${Date.now()}`,
            Sender: "corrupted_voter",
            Receiver: "fake_candidate",
            Payload: "CORRUPTED_VOTE",
            Timestamp: timestamp
          },
          {
            ID: `tx_double_${nodeId}_${blockCounter}_${Date.now()}`,
            Sender: "voter_123",
            Receiver: "candidate_1",
            Payload: "VOTE",
            Timestamp: timestamp
          },
          {
            ID: `tx_double2_${nodeId}_${blockCounter}_${Date.now()}`,
            Sender: "voter_123", // Same voter, different candidate (double voting)
            Receiver: "candidate_2", 
            Payload: "VOTE",
            Timestamp: timestamp
          }
        ]

        const maliciousBlock = {
          Index: currentBlocks.length,
          Hash: `MAL${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}CORRUPT`,
          PrevHash: lastBlock.Hash,
          Timestamp: timestamp,
          Transactions: maliciousTransactions,
          MerkleRoot: `corrupted_merkle_${nodeId}_${blockCounter}`,
          Validator: nodeId
        }

        newBlockchainData[nodeId] = [...currentBlocks, maliciousBlock]
      } else {
        // Honest node: legitimate block
        const honestTransactions = [
          {
            ID: `tx_${nodeId}_${blockCounter}_${Date.now()}`,
            Sender: `voter_${Math.floor(Math.random() * 1000)}`,
            Receiver: `candidate_${Math.floor(Math.random() * 3) + 1}`,
            Payload: "VOTE",
            Timestamp: timestamp
          }
        ]

        // If consensus, add multiple transactions
        if (isFromConsensus) {
          for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
            honestTransactions.push({
              ID: `tx_consensus_${nodeId}_${blockCounter}_${i}_${Date.now()}`,
              Sender: `voter_${Math.floor(Math.random() * 1000)}`,
              Receiver: `candidate_${Math.floor(Math.random() * 3) + 1}`,
              Payload: "VOTE",
              Timestamp: timestamp
            })
          }
        }

        const honestBlock = {
          Index: currentBlocks.length,
          Hash: `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
          PrevHash: lastBlock.Hash,
          Timestamp: timestamp,
          Transactions: honestTransactions,
          MerkleRoot: `merkle_${nodeId}_${blockCounter}_${Date.now()}`,
          Validator: isFromConsensus ? "consensus" : nodeId
        }

        newBlockchainData[nodeId] = [...currentBlocks, honestBlock]
      }
    })

    setBlockchainData(newBlockchainData)

    // Update node heights
    const updatedNodes = nodes.map(node => ({
      ...node,
      height: newBlockchainData[node.id] ? newBlockchainData[node.id].length : node.height,
      hash: newBlockchainData[node.id] && newBlockchainData[node.id].length > 0 ? 
        newBlockchainData[node.id][newBlockchainData[node.id].length - 1].Hash.slice(0, 16) : node.hash
    }))
    if (onNodesUpdate) {
      onNodesUpdate(updatedNodes)
    }
  }

  // Expose the addNewBlock function globally so it can be called from dashboard
  useEffect(() => {
    window.addMockBlock = addNewBlock
  }, [blockchainData, nodes])

  const fetchBlockchainData = async () => {
    setIsLoading(true)
    
    // Always use mock data for demonstration
    setTimeout(() => {
      initializeMockBlockchains()
      setIsLoading(false)
    }, 500) // Small delay for loading effect
  }

  useEffect(() => {
    const activeNodes = nodes.filter(n => n.status !== "inactive")
    if (activeNodes.length > 0) {
      initializeMockBlockchains()
    }
  }, [nodes])

  const currentBlocks = selectedNode ? (blockchainData[selectedNode] || []) : []
  
  // Check consistency between honest nodes
  const checkBlockchainConsistency = () => {
    const honestNodes = Object.keys(blockchainData).filter(nodeId => {
      const node = nodes.find(n => n.id === nodeId)
      return node && node.status === "active"
    })

    if (honestNodes.length < 2) return { consistent: true, details: "Not enough honest nodes to compare" }

    const firstHonestChain = blockchainData[honestNodes[0]]
    const inconsistencies = []

    for (let i = 1; i < honestNodes.length; i++) {
      const otherChain = blockchainData[honestNodes[i]]
      
      if (firstHonestChain.length !== otherChain.length) {
        inconsistencies.push(`${honestNodes[i]} has different chain length`)
      } else {
        for (let j = 0; j < firstHonestChain.length; j++) {
          if (firstHonestChain[j].Hash !== otherChain[j].Hash) {
            inconsistencies.push(`Block ${j} hash differs in ${honestNodes[i]}`)
          }
        }
      }
    }

    return {
      consistent: inconsistencies.length === 0,
      details: inconsistencies.length === 0 ? "All honest nodes synchronized" : inconsistencies.join(", ")
    }
  }

  const consistency = checkBlockchainConsistency()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Blockchain Monitor
          <div style={{ display: "flex", gap: "8px" }}>
            {!consistency.consistent && (
              <Badge variant="destructive">
                <AlertTriangle style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                Byzantine Attack Detected
              </Badge>
            )}
            <Button onClick={fetchBlockchainData} disabled={isLoading} variant="outline" size="sm">
              <RefreshCw style={{ width: "16px", height: "16px", marginRight: "4px" }} />
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
            <Button onClick={() => addNewBlock(false)} variant="outline" size="sm">
              <Zap style={{ width: "16px", height: "16px", marginRight: "4px" }} />
              Add Block
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Network Health Status */}
        <div style={{ 
          marginBottom: "16px",
          padding: "12px",
          backgroundColor: consistency.consistent ? "var(--success-bg)" : "var(--danger-bg)",
          border: `1px solid ${consistency.consistent ? "var(--success)" : "var(--danger)"}`,
          borderRadius: "8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            {consistency.consistent ? (
              <Shield style={{ width: "16px", height: "16px", color: "var(--success)" }} />
            ) : (
              <AlertTriangle style={{ width: "16px", height: "16px", color: "var(--danger)" }} />
            )}
            <strong style={{ color: consistency.consistent ? "var(--success)" : "var(--danger)" }}>
              Network Status: {consistency.consistent ? "Secure" : "Under Attack"}
            </strong>
          </div>
          <div style={{ fontSize: "0.875rem", color: consistency.consistent ? "var(--success)" : "var(--danger)" }}>
            {consistency.details}
          </div>
        </div>

        {/* Node Selection with Visual Indicators */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            {Object.keys(blockchainData).map(nodeId => {
              const nodeBlocks = blockchainData[nodeId] || []
              const node = nodes.find(n => n.id === nodeId)
              const isMalicious = node?.status === "malicious"
              
              return (
                <Button
                  key={nodeId}
                  onClick={() => setSelectedNode(nodeId)}
                  variant={selectedNode === nodeId ? "primary" : "outline"}
                  size="sm"
                  style={{ 
                    position: "relative",
                    borderColor: isMalicious ? "var(--danger)" : undefined,
                    backgroundColor: selectedNode === nodeId && isMalicious ? "var(--danger)" : undefined
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {isMalicious && <AlertTriangle style={{ width: "12px", height: "12px" }} />}
                    {nodeId.toUpperCase()}
                    <Badge 
                      variant={isMalicious ? "destructive" : "default"}
                      style={{ marginLeft: "4px" }}
                    >
                      {nodeBlocks.length}
                    </Badge>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Selected Node Blockchain */}
        {selectedNode && (
          <div>
            <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Database style={{ width: "20px", height: "20px" }} />
              {selectedNode.toUpperCase()} Blockchain
              <Badge variant="outline">{currentBlocks.length} blocks</Badge>
              {nodes.find(n => n.id === selectedNode)?.status === "malicious" && (
                <Badge variant="destructive">
                  <AlertTriangle style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                  Malicious Node
                </Badge>
              )}
            </h3>
            
            <div style={{ 
              maxHeight: "400px", 
              overflowY: "auto",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "16px"
            }}>
              {currentBlocks.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "32px", 
                  color: "var(--text-secondary)" 
                }}>
                  No blocks available
                </div>
              ) : (
                [...currentBlocks].reverse().map((block, index) => {
                  const actualIndex = currentBlocks.length - 1 - index
                  const isMaliciousBlock = block.Hash.includes("MAL") || block.Hash.includes("CORRUPT")
                  const hasSuspiciousTransactions = block.Transactions?.some(tx => 
                    tx.Payload === "FAKE_VOTE" || tx.Payload === "CORRUPTED_VOTE"
                  )
                  
                  return (
                    <div key={block.Index || actualIndex} style={{ 
                      padding: "16px", 
                      backgroundColor: isMaliciousBlock ? "var(--danger-bg)" : 
                                     (index === 0 ? "var(--primary-bg)" : "var(--surface)"), 
                      borderRadius: "8px",
                      border: `2px solid ${isMaliciousBlock ? "var(--danger)" : 
                                          (index === 0 ? "var(--primary)" : "var(--border)")}`,
                      marginBottom: "12px",
                      position: "relative"
                    }}>
                      {/* Block Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong>Block {block.Index}</strong>
                          {isMaliciousBlock && (
                            <Badge variant="destructive" size="sm">
                              <AlertTriangle style={{ width: "10px", height: "10px", marginRight: "2px" }} />
                              CORRUPTED
                            </Badge>
                          )}
                          {block.Validator === "consensus" && (
                            <Badge variant="default" size="sm">
                              <CheckCircle style={{ width: "10px", height: "10px", marginRight: "2px" }} />
                              CONSENSUS
                            </Badge>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <Badge variant="outline" size="sm">
                            {block.Transactions?.length || 0} txs
                          </Badge>
                          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            {new Date(block.Timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Block Metadata */}
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                        <div style={{ marginBottom: "4px" }}>
                          <strong>Hash:</strong> 
                          <span style={{ 
                            fontFamily: "monospace", 
                            color: isMaliciousBlock ? "var(--danger)" : "var(--text-primary)" 
                          }}>
                            {block.Hash?.slice(0, 40)}...
                          </span>
                        </div>
                        <div style={{ marginBottom: "4px" }}>
                          <strong>Previous:</strong> 
                          <span style={{ fontFamily: "monospace" }}>
                            {block.PrevHash?.slice(0, 40)}...
                          </span>
                        </div>
                        <div>
                          <strong>Validator:</strong> {block.Validator}
                        </div>
                      </div>

                      {/* Transactions Details */}
                      {block.Transactions && block.Transactions.length > 0 && (
                        <div style={{ 
                          marginTop: "12px",
                          padding: "12px",
                          backgroundColor: "var(--surface)",
                          borderRadius: "6px",
                          border: "1px solid var(--border)"
                        }}>
                          <div style={{ 
                            fontSize: "0.875rem", 
                            fontWeight: "600", 
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            Transactions ({block.Transactions.length})
                            {hasSuspiciousTransactions && (
                              <Badge variant="destructive" size="sm">
                                Suspicious Activity
                              </Badge>
                            )}
                          </div>
                          {block.Transactions.map((tx, txIndex) => {
                            const isSuspicious = tx.Payload === "FAKE_VOTE" || tx.Payload === "CORRUPTED_VOTE"
                            const isDoubleVote = block.Transactions.filter(t => t.Sender === tx.Sender).length > 1
                            
                            return (
                              <div key={tx.ID || txIndex} style={{ 
                                fontSize: "0.75rem", 
                                color: isSuspicious ? "var(--danger)" : "var(--text-secondary)",
                                marginBottom: "4px",
                                padding: "4px",
                                backgroundColor: isSuspicious ? "var(--danger-bg)" : "transparent",
                                borderRadius: "4px",
                                border: isSuspicious ? "1px solid var(--danger)" : "none"
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span>
                                    {tx.Sender?.slice(0, 12)}... → {tx.Receiver}
                                  </span>
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    <Badge 
                                      variant={isSuspicious ? "destructive" : "outline"} 
                                      size="sm"
                                    >
                                      {tx.Payload}
                                    </Badge>
                                    {isDoubleVote && (
                                      <Badge variant="destructive" size="sm">DOUBLE</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Network Comparison Grid */}
        {Object.keys(blockchainData).length > 1 && (
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              Network Blockchain Comparison
              <Badge variant={consistency.consistent ? "default" : "destructive"}>
                {consistency.consistent ? "Synchronized" : "Diverged"}
              </Badge>
            </h4>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: "12px" 
            }}>
              {Object.entries(blockchainData).map(([nodeId, blocks]) => {
                const node = nodes.find(n => n.id === nodeId)
                const isMalicious = node?.status === "malicious"
                const lastBlock = blocks[blocks.length - 1]
                
                return (
                  <div key={nodeId} style={{ 
                    padding: "16px",
                    border: `2px solid ${isMalicious ? "var(--danger)" : "var(--border)"}`,
                    borderRadius: "8px",
                    backgroundColor: isMalicious ? "var(--danger-bg)" : "var(--surface)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => setSelectedNode(nodeId)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <strong>{nodeId.toUpperCase()}</strong>
                        {isMalicious && <AlertTriangle style={{ width: "14px", height: "14px", color: "var(--danger)" }} />}
                      </div>
                      <Badge variant={isMalicious ? "destructive" : "default"}>
                        {blocks.length} blocks
                      </Badge>
                    </div>
                    
                    <div style={{ fontSize: "0.875rem", marginBottom: "8px" }}>
                      <div style={{ color: "var(--text-secondary)" }}>
                        Status: <span style={{ color: isMalicious ? "var(--danger)" : "var(--success)" }}>
                          {node?.status || "unknown"}
                        </span>
                      </div>
                      <div style={{ color: "var(--text-secondary)" }}>
                        Last Hash: <span style={{ fontFamily: "monospace" }}>
                          {lastBlock ? lastBlock.Hash.slice(0, 12) : "none"}...
                        </span>
                      </div>
                    </div>

                    {/* Mini blockchain visualization */}
                    <div style={{ display: "flex", gap: "2px", marginTop: "8px" }}>
                      {blocks.slice(-8).map((block, i) => {
                        const isCorrupted = block.Hash.includes("MAL") || block.Hash.includes("CORRUPT")
                        return (
                          <div key={i} style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: isCorrupted ? "var(--danger)" : 
                                           (i === blocks.slice(-8).length - 1 ? "var(--primary)" : "var(--text-secondary)"),
                            borderRadius: "2px",
                            border: "1px solid var(--border)"
                          }} />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Detailed Analysis */}
        <div style={{ 
          marginTop: "20px",
          padding: "16px",
          backgroundColor: "var(--surface)",
          borderRadius: "8px",
          border: "1px solid var(--border)"
        }}>
          <h4 style={{ marginBottom: "12px" }}>Byzantine Fault Analysis</h4>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "16px",
            fontSize: "0.875rem"
          }}>
            <div>
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>Network Composition</div>
              <div>Honest Nodes: {nodes.filter(n => n.status === "active").length}</div>
              <div>Malicious Nodes: {nodes.filter(n => n.status === "malicious").length}</div>
              <div>Offline Nodes: {nodes.filter(n => n.status === "inactive").length}</div>
            </div>
            
            <div>
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>Fault Tolerance</div>
              <div>Max Byzantine Faults: {Math.floor((nodes.length - 1) / 3)}</div>
              <div>Current Faults: {nodes.filter(n => n.status === "malicious").length}</div>
              <div style={{ 
                color: nodes.filter(n => n.status === "malicious").length <= Math.floor((nodes.length - 1) / 3) ? 
                       "var(--success)" : "var(--danger)" 
              }}>
                Status: {nodes.filter(n => n.status === "malicious").length <= Math.floor((nodes.length - 1) / 3) ? 
                         "Secure" : "Compromised"}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>Blockchain Integrity</div>
              <div>Consistent Chains: {
                Object.keys(blockchainData).filter(nodeId => {
                  const node = nodes.find(n => n.id === nodeId)
                  return node?.status === "active"
                }).length
              }</div>
              <div>Corrupted Chains: {
                Object.keys(blockchainData).filter(nodeId => {
                  const node = nodes.find(n => n.id === nodeId)
                  return node?.status === "malicious"
                }).length
              }</div>
            </div>

            <div>
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>Attack Detection</div>
              {Object.entries(blockchainData).map(([nodeId, blocks]) => {
                const node = nodes.find(n => n.id === nodeId)
                if (node?.status !== "malicious") return null
                
                const corruptedBlocks = blocks.filter(b => 
                  b.Hash.includes("MAL") || b.Hash.includes("CORRUPT")
                ).length
                
                return (
                  <div key={nodeId} style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
                    {nodeId}: {corruptedBlocks} corrupted blocks
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}