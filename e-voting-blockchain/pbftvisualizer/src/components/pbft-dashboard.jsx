"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./common/Card"
import { Badge } from "./common/Badge"
import { Button } from "./common/Button"
import { NodeStatus } from "./node-status"
import { ConsensusVisualizer } from "./consensus-visualizer"
import { ByzantineTestPanel } from "./byzantine-test-panel"
import { BlockchainMonitor } from "./blockchain-monitor"

const initialNodes = [
  { id: "node1", address: "localhost", port: 8081, status: "inactive", height: 0, hash: "", isPrimary: true },
  { id: "node2", address: "localhost", port: 8082, status: "inactive", height: 0, hash: "" },
  { id: "node3", address: "localhost", port: 8083, status: "inactive", height: 0, hash: "" },
  { id: "node4", address: "localhost", port: 8084, status: "inactive", height: 0, hash: "" },
]

export function PBFTDashboard() {
  const [nodes, setNodes] = useState(initialNodes)
  const [consensusPhase, setConsensusPhase] = useState("idle")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkNodesStatus = async () => {
    setIsLoading(true)
    let hasActiveNodes = false

    try {
      const updatedNodes = await Promise.all(
        nodes.map(async (node) => {
          try {
            // Try to get PBFT status from backend
            const statusResponse = await fetch(`http://${node.address}:${node.port}/pbft/status`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            })

            if (statusResponse.ok) {
              const pbftStatus = await statusResponse.json()
              
              // Get blockchain state
              const blockchainResponse = await fetch(`http://${node.address}:${node.port}/blockchain/state`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              })

              if (blockchainResponse.ok) {
                const blockchainState = await blockchainResponse.json()
                hasActiveNodes = true

                return {
                  ...node,
                  status: pbftStatus.behavior === 1 ? "malicious" : "active", // 1 = BehaviorMalicious
                  height: blockchainState.height || 0,
                  hash: blockchainState.last_hash || "genesis",
                  sequenceNum: pbftStatus.sequence_num || 0,
                  view: pbftStatus.view || 0,
                  state: pbftStatus.state || 0,
                  isPrimary: pbftStatus.is_primary || false
                }
              }
            }
          } catch (error) {
            console.log(`Node ${node.id} unavailable:`, error.message)
          }
          
          return { ...node, status: "inactive" }
        })
      )
      
      setNodes(updatedNodes)
      setIsConnected(hasActiveNodes)
    } catch (error) {
      console.error("Error checking nodes status:", error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Submit a test vote to trigger consensus
  const submitTestVote = async () => {
    const primaryNode = nodes.find(node => node.isPrimary && node.status === "active")
    if (!primaryNode) {
      alert("No active primary node found")
      return
    }

    try {
      const response = await fetch(`http://${primaryNode.address}:${primaryNode.port}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_id: `test_voter_${Date.now()}`,
          candidate_id: `candidate_${Math.floor(Math.random() * 3) + 1}`
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Vote submitted successfully! Transaction ID: ${result.transaction_id}`)
        
        // Refresh node status after a delay to see the new block
        setTimeout(() => {
          checkNodesStatus()
        }, 3000)
      } else {
        alert("Failed to submit vote")
      }
    } catch (error) {
      console.error("Error submitting vote:", error)
      alert("Error submitting vote")
    }
  }

  useEffect(() => {
    checkNodesStatus()
    const interval = setInterval(checkNodesStatus, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="pbft-dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title text-4xl">PBFT Consensus Visualization</h1>
          <p className="text-muted text-lg">Practical Byzantine Fault Tolerance Algorithm with 4 Blockchain Nodes</p>
          <div className="flex items-center justify-center gap-2" style={{ marginTop: "1rem" }}>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? `${nodes.filter(n => n.status === "active" || n.status === "malicious").length} Nodes Connected` : "Nodes Offline"}
            </Badge>
            <Button 
              onClick={checkNodesStatus} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Checking..." : "Refresh Status"}
            </Button>
            <Button 
              onClick={submitTestVote} 
              variant="primary" 
              size="sm"
              disabled={!isConnected || isLoading}
            >
              Submit Test Vote
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Card style={{ marginBottom: "24px" }}>
            <CardContent style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ color: "var(--danger)", marginBottom: "16px" }}>
                <strong>Backend Not Connected</strong>
              </div>
              <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
                Make sure your PBFT nodes are running:
              </p>
              <div style={{ 
                backgroundColor: "var(--surface)", 
                padding: "16px", 
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "0.875rem",
                textAlign: "left"
              }}>
                <div>go run cmd/pbft-node/main.go -id node1 -port 8081</div>
                <div>go run cmd/pbft-node/main.go -id node2 -port 8082</div>
                <div>go run cmd/pbft-node/main.go -id node3 -port 8083</div>
                <div>go run cmd/pbft-node/main.go -id node4 -port 8084</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Node Status Grid */}
        <Card>
          <CardHeader>
            <CardTitle>
              Node Network Status
              <Badge variant="outline">
                {nodes.filter((n) => n.status === "active" || n.status === "malicious").length}/4 Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="node-grid">
              {nodes.map((node) => (
                <NodeStatus key={node.id} node={node} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Consensus Visualizer */}
        <ConsensusVisualizer 
          nodes={nodes} 
          phase={consensusPhase} 
          onPhaseChange={setConsensusPhase}
          onNodesUpdate={setNodes}
        />

        {/* Byzantine Testing */}
        <ByzantineTestPanel 
          nodes={nodes} 
          onNodesUpdate={setNodes}
          onRefreshNodes={checkNodesStatus}
        />

        {/* Blockchain Monitor */}
        <BlockchainMonitor nodes={nodes} />
      </div>
    </div>
  )
}