"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./common/Card"
import { Badge } from "./common/Badge"
import { Button } from "./common/Button"
import { NodeStatus } from "./node-status"
import { ConsensusVisualizer } from "./consensus-visualizer"
import { ByzantineTestPanel } from "./byzantine-test-panel"
import { BlockchainMonitor } from "./blockchain-monitor"

import "../styles/globals.css"
import "../styles/components.css"
import "../styles/dashboard.css"

const initialNodes = [
  { id: "node1", address: "localhost", port: 8081, status: "inactive", height: 1, hash: "genesis123", isPrimary: true },
  { id: "node2", address: "localhost", port: 8082, status: "inactive", height: 1, hash: "genesis123" },
  { id: "node3", address: "localhost", port: 8083, status: "inactive", height: 1, hash: "genesis123" },
  { id: "node4", address: "localhost", port: 8084, status: "inactive", height: 1, hash: "genesis123" },
]

export function PBFTDashboard() {
  const [nodes, setNodes] = useState(initialNodes)
  const [consensusPhase, setConsensusPhase] = useState("idle")
  const [isConnected, setIsConnected] = useState(false)

  const checkNodesStatus = async () => {
    const mockData = [
      { height: 1, hash: "genesis123" },
      { height: 1, hash: "genesis123" },
      { height: 1, hash: "genesis123" },
      { height: 1, hash: "genesis123" },
    ]

    try {
      const updatedNodes = await Promise.all(
        nodes.map(async (node, index) => {
          try {
            const response = await fetch(`http://${node.address}:${node.port}/pbft/status`)
            if (response.ok) {
              const data = await response.json()
              return {
                ...node,
                status: "active",
                height: data.height || 0,
                hash: data.hash || "",
              }
            }
          } catch (error) {
            console.log(`[v0] Using mock data for ${node.id} (backend not running) ${error}`)
            return {
              ...node,
              status: "demo",
              height: mockData[index].height,
              hash: mockData[index].hash,
            }
          }
          return { ...node, status: "inactive" }
        }),
      )
      setNodes(updatedNodes)
      setIsConnected(updatedNodes.some((node) => node.status === "active" || node.status === "demo"))
    } catch (error) {
      console.log("[v0] Error checking nodes status:", error)
    }
  }

  useEffect(() => {
    checkNodesStatus()
    const interval = setInterval(checkNodesStatus, 3000)
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
              {isConnected ? "Demo Mode (Genesis Block)" : "Nodes Offline"}
            </Badge>
            <Button onClick={checkNodesStatus} variant="outline" size="sm">
              Refresh Status
            </Button>
          </div>
        </div>

        {/* Node Status Grid */}
        <Card>
          <CardHeader>
            <CardTitle>
              Node Network Status
              <Badge variant="outline">
                {nodes.filter((n) => n.status === "active" || n.status === "demo").length}/4 Active
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
        <ConsensusVisualizer nodes={nodes} phase={consensusPhase} onPhaseChange={setConsensusPhase} />

        {/* Byzantine Testing */}
        <ByzantineTestPanel nodes={nodes} onNodesUpdate={setNodes} />

        {/* Blockchain Monitor */}
        <BlockchainMonitor nodes={nodes} />
      </div>
    </div>
  )
}