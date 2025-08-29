"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NodeStatus } from "@/components/node-status"
import { ConsensusVisualizer } from "@/components/consensus-visualizer"
import { ByzantineTestPanel } from "@/components/byzantine-test-panel"
import { BlockchainMonitor } from "@/components/blockchain-monitor"

const initialNodes = [
  { id: "node1", address: "localhost", port: 8081, status: "active", height: 0, hash: "", isPrimary: true },
  { id: "node2", address: "localhost", port: 8082, status: "active", height: 0, hash: "" },
  { id: "node3", address: "localhost", port: 8083, status: "active", height: 0, hash: "" },
  { id: "node4", address: "localhost", port: 8084, status: "active", height: 0, hash: "" },
]

export function PBFTDashboard() {
  const [nodes, setNodes] = useState(initialNodes)
  const [consensusPhase, setConsensusPhase] = useState("idle")
  const [isConnected, setIsConnected] = useState(false)

  const checkNodesStatus = async () => {
    try {
      const updatedNodes = await Promise.all(
        nodes.map(async (node) => {
          try {
            const response = await fetch(`http://${node.address}:${node.port}/status`)
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
            console.log(`[v0] Node ${node.id} connection failed:`, error)
          }
          return { ...node, status: "inactive" }
        }),
      )
      setNodes(updatedNodes)
      setIsConnected(updatedNodes.some((node) => node.status === "active"))
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-balance">PBFT Consensus Visualization</h1>
        <p className="text-muted-foreground text-lg text-pretty">
          Practical Byzantine Fault Tolerance Algorithm with 4 Blockchain Nodes
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Nodes Connected" : "Nodes Offline"}
          </Badge>
          <Button onClick={checkNodesStatus} variant="outline" size="sm">
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Node Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Node Network Status
            <Badge variant="outline">{nodes.filter((n) => n.status === "active").length}/4 Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
  )
}
