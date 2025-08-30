"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./common/Card"
import { Button } from "./common/Button"
import { Badge } from "./common/Badge"
import { RefreshCw, Database, CheckCircle, XCircle } from "lucide-react"

export function BlockchainMonitor({ nodes }) {
  const [blockchainData, setBlockchainData] = useState({})
  const [selectedNode, setSelectedNode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const activeNodes = nodes.filter((n) => n.status !== "inactive")

  // Mock genesis block
  const genesisBlock = {
    height: 0,
    hash: "9f7a1c4b8d2e53f6a17e94c0d8bb23a1cf15d4a37b62e9f0c4d1a08e7b29c5d2",
    previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
    timestamp: "2024-01-01T00:00:00Z",
    data: "Genesis Block - PBFT Blockchain",
    validator: "genesis",
  }

  const generateMockHash = (height, nodeId) => {
    const seed = height * 1000 + nodeId.charCodeAt(nodeId.length - 1)
    return seed.toString(16).padStart(64, "0").slice(0, 64)
  }

  const generateMockBlockchain = (node) => {
    const blocks = [genesisBlock]

    for (let i = 1; i <= node.height; i++) {
      const previousBlock = blocks[i - 1]
      const block = {
        height: i,
        hash: generateMockHash(i, node.id),
        previousHash: previousBlock.hash,
        timestamp: new Date(Date.now() - (node.height - i) * 60000).toISOString(),
        data: `Block ${i} - Transaction Data`,
        validator: node.isPrimary ? node.id : `node${(i % 4) + 1}`,
      }
      blocks.push(block)
    }

    return blocks
  }

  const fetchBlockchainData = async () => {
    setIsLoading(true)
    const newBlockchainData = {}

    for (const node of activeNodes) {
      try {
        const mockBlocks = generateMockBlockchain(node)
        newBlockchainData[node.id] = mockBlocks
      } catch (error) {
        console.log(`Failed to fetch blockchain data from ${node.id}:`, error)
        newBlockchainData[node.id] = [genesisBlock]
      }
    }

    setBlockchainData(newBlockchainData)
    if (!selectedNode && activeNodes.length > 0) {
      setSelectedNode(activeNodes[0].id)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (activeNodes.length > 0) {
      fetchBlockchainData()
    }
  }, [nodes])

  const checkSynchronization = () => {
    if (Object.keys(blockchainData).length < 2) return { synchronized: true, details: "Insufficient data" }

    const nodeIds = Object.keys(blockchainData)
    const firstNodeBlocks = blockchainData[nodeIds[0]]

    for (let i = 1; i < nodeIds.length; i++) {
      const currentNodeBlocks = blockchainData[nodeIds[i]]
      if (firstNodeBlocks.length !== currentNodeBlocks.length) {
        return { synchronized: false, details: "Height mismatch between nodes" }
      }
    }

    return { synchronized: true, details: "All nodes synchronized" }
  }

  const syncStatus = checkSynchronization()
  const currentBlocks = selectedNode ? blockchainData[selectedNode] || [] : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Database style={{ width: "20px", height: "20px" }} />
            <span>Blockchain Monitor</span>
          </div>
          <Button onClick={fetchBlockchainData} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw style={{ width: "16px", height: "16px" }} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Network Status */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "16px", 
          marginBottom: "24px" 
        }}>
          <div style={{ 
            padding: "16px", 
            backgroundColor: "var(--surface)", 
            borderRadius: "8px", 
            border: "1px solid var(--border)" 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              {syncStatus.synchronized ? (
                <CheckCircle style={{ width: "20px", height: "20px", color: "var(--success)" }} />
              ) : (
                <XCircle style={{ width: "20px", height: "20px", color: "var(--danger)" }} />
              )}
              <span style={{ fontWeight: "600" }}>Sync Status</span>
            </div>
            <Badge variant={syncStatus.synchronized ? "success" : "destructive"}>
              {syncStatus.synchronized ? "Synchronized" : "Out of Sync"}
            </Badge>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "8px" }}>
              {syncStatus.details}
            </p>
          </div>

          <div style={{ 
            padding: "16px", 
            backgroundColor: "var(--surface)", 
            borderRadius: "8px", 
            border: "1px solid var(--border)" 
          }}>
            <div style={{ fontWeight: "600", marginBottom: "8px" }}>Network Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.875rem" }}>
              <div>Active Nodes: <strong>{activeNodes.length}</strong></div>
              <div>Max Height: <strong>{Math.max(...Object.values(blockchainData).map((blocks) => blocks.length - 1), 0)}</strong></div>
              <div>Malicious: <strong>{activeNodes.filter((n) => n.status === "malicious").length}</strong></div>
              <div>Status: <strong style={{ color: syncStatus.synchronized ? "var(--success)" : "var(--danger)" }}>
                {syncStatus.synchronized ? "OK" : "ERROR"}
              </strong></div>
            </div>
          </div>
        </div>

        {/* Node Selector */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
            Select Node to View Blockchain:
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {activeNodes.map((node) => (
              <Button
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                variant={selectedNode === node.id ? "primary" : "outline"}
                size="sm"
              >
                {node.id.toUpperCase()}
                {node.isPrimary && " (Primary)"}
                {node.status === "malicious" && " (Malicious)"}
              </Button>
            ))}
          </div>
        </div>

        {/* Blockchain Display */}
        {selectedNode && (
          <div>
            <h3 style={{ fontWeight: "600", marginBottom: "16px" }}>
              {selectedNode.toUpperCase()} Blockchain State
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginLeft: "8px" }}>
                ({currentBlocks.length} blocks)
              </span>
            </h3>

            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "12px", 
              maxHeight: "400px", 
              overflowY: "auto",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "16px"
            }}>
              {currentBlocks.map((block) => (
                <div key={`${selectedNode}-${block.height}`} style={{ 
                  padding: "12px", 
                  backgroundColor: "var(--surface)", 
                  borderRadius: "6px",
                  border: "1px solid var(--border)"
                }}>
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
                    gap: "12px", 
                    fontSize: "0.875rem" 
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: "600" }}>Block {block.height}</span>
                        {block.height === 0 && <Badge variant="outline">Genesis</Badge>}
                      </div>
                      <div style={{ color: "var(--text-secondary)" }}>
                        Hash: <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {block.hash.slice(0, 16)}...
                        </span>
                      </div>
                      <div style={{ color: "var(--text-secondary)" }}>
                        Previous: <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                          {block.previousHash.slice(0, 16)}...
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>
                        Time: {new Date(block.timestamp).toLocaleString()}
                      </div>
                      <div style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>
                        Validator: {block.validator}
                      </div>
                      <div style={{ color: "var(--text-secondary)" }}>
                        Data: {block.data}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedNode && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            No active nodes to display blockchain data
          </div>
        )}
      </CardContent>
    </Card>
  )
}