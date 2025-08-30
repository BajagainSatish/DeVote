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
  const [demoMode, setDemoMode] = useState(false)

  // Initialize demo mode with mock active nodes
  const initializeDemoMode = () => {
    const mockActiveNodes = initialNodes.map((node, index) => ({
      ...node,
      status: index === 0 ? "active" : (index === 3 ? "malicious" : "active"), // Make node4 malicious for demo
      height: 3 + Math.floor(Math.random() * 2), // Random height 3-4
      hash: `${Date.now().toString(16).slice(-8)}${Math.random().toString(16).slice(2, 10)}`,
      sequenceNum: Math.floor(Math.random() * 10),
      view: 0,
      state: 0,
      isPrimary: index === 0
    }))

    setNodes(mockActiveNodes)
    setIsConnected(true)
    setDemoMode(true)
  }

  const checkNodesStatus = async () => {
    if (demoMode) {
      // In demo mode, just simulate some updates
      const updatedNodes = nodes.map(node => ({
        ...node,
        sequenceNum: node.sequenceNum + Math.floor(Math.random() * 2),
        // Randomly update heights occasionally
        height: Math.random() < 0.3 ? node.height + 1 : node.height
      }))
      setNodes(updatedNodes)
      return
    }

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
      
      // If no nodes are active, offer demo mode
      if (!hasActiveNodes && !demoMode) {
        console.log("No active nodes detected, demo mode available")
      }
    } catch (error) {
      console.error("Error checking nodes status:", error)
      setIsConnected(false)
    }
  }

  useEffect(() => {
    checkNodesStatus()
    if (!demoMode) {
      const interval = setInterval(checkNodesStatus, 5000) // Check every 5 seconds
      return () => clearInterval(interval)
    }
  }, [demoMode])

  return (
    <div className="pbft-dashboard">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title text-4xl">PBFT Consensus Visualization</h1>
          <p className="text-muted text-lg">Practical Byzantine Fault Tolerance Algorithm with 4 Blockchain Nodes</p>
          <div className="flex items-center justify-center gap-2" style={{ marginTop: "1rem" }}>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? 
                `${nodes.filter(n => n.status === "active" || n.status === "malicious").length} Nodes Connected` : 
                "Nodes Offline"
              }
            </Badge>
            {demoMode && (
              <Badge variant="outline">Demo Mode</Badge>
            )}
          </div>
        </div>

        {/* Connection Status / Demo Mode Toggle */}
        {!isConnected && !demoMode && (
          <Card style={{ marginBottom: "24px" }}>
            <CardContent style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ color: "var(--danger)", marginBottom: "16px" }}>
                <strong>Backend Not Connected</strong>
              </div>
              <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
                Make sure your PBFT nodes are running, or use demo mode for visualization:
              </p>
              <div style={{ 
                backgroundColor: "var(--surface)", 
                padding: "16px", 
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "0.875rem",
                textAlign: "left",
                marginBottom: "16px"
              }}>
                <div>go run cmd/pbft-node/main.go -id node1 -port 8081</div>
                <div>go run cmd/pbft-node/main.go -id node2 -port 8082</div>
                <div>go run cmd/pbft-node/main.go -id node3 -port 8083</div>
                <div>go run cmd/pbft-node/main.go -id node4 -port 8084</div>
              </div>
              <Button onClick={initializeDemoMode} variant="primary">
                Enable Demo Mode
              </Button>
            </CardContent>
          </Card>
        )}

        {demoMode && (
          <Card style={{ marginBottom: "24px" }}>
            <CardContent style={{ textAlign: "center", padding: "16px" }}>
              <div style={{ color: "var(--primary)", marginBottom: "8px" }}>
                <strong>Demo Mode Active</strong>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Using simulated PBFT network for demonstration. All features work with mock data.
              </p>
              <Button 
                onClick={() => {
                  setDemoMode(false)
                  setNodes(initialNodes)
                  setIsConnected(false)
                  checkNodesStatus()
                }} 
                variant="outline" 
                size="sm"
                style={{ marginTop: "8px" }}
              >
                Try Live Backend
              </Button>
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
          demoMode={demoMode}
        />

        {/* Byzantine Testing */}
        <ByzantineTestPanel 
          nodes={nodes} 
          onNodesUpdate={setNodes}
          onRefreshNodes={checkNodesStatus}
          demoMode={demoMode}
        />

        {/* Blockchain Monitor */}
        <BlockchainMonitor nodes={nodes} onNodesUpdate={setNodes} />
      </div>
    </div>
  )
}