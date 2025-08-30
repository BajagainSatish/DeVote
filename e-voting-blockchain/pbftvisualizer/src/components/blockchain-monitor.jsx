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

  const fetchBlockchainData = async () => {
    setIsLoading(true)
    const newBlockchainData = {}

    for (const node of nodes.filter(n => n.status !== "inactive")) {
      try {
        const response = await fetch(`http://${node.address}:${node.port}/blockchain`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const data = await response.json()
          newBlockchainData[node.id] = data.Blocks || []
        }
      } catch (error) {
        console.log(`Failed to fetch blockchain from ${node.id}:`, error)
        newBlockchainData[node.id] = []
      }
    }

    setBlockchainData(newBlockchainData)
    if (!selectedNode && Object.keys(newBlockchainData).length > 0) {
      setSelectedNode(Object.keys(newBlockchainData)[0])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    const activeNodes = nodes.filter(n => n.status !== "inactive")
    if (activeNodes.length > 0) {
      fetchBlockchainData()
    }
  }, [nodes])

  const currentBlocks = selectedNode ? blockchainData[selectedNode] || [] : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Real Blockchain Monitor
          <Button onClick={fetchBlockchainData} disabled={isLoading} variant="outline" size="sm">
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Object.keys(blockchainData).map(nodeId => (
              <Button
                key={nodeId}
                onClick={() => setSelectedNode(nodeId)}
                variant={selectedNode === nodeId ? "primary" : "outline"}
                size="sm"
              >
                {nodeId.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {selectedNode && (
          <div>
            <h3 style={{ marginBottom: "16px" }}>
              {selectedNode.toUpperCase()} Blockchain ({currentBlocks.length} blocks)
            </h3>
            
            <div style={{ 
              maxHeight: "400px", 
              overflowY: "auto",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "16px"
            }}>
              {currentBlocks.map((block, index) => (
                <div key={index} style={{ 
                  padding: "12px", 
                  backgroundColor: "var(--surface)", 
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  marginBottom: "8px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <strong>Block {block.Index}</strong>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {block.Timestamp}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    Hash: {block.Hash?.slice(0, 16)}...<br/>
                    Previous: {block.PrevHash?.slice(0, 16)}...<br/>
                    Transactions: {block.Transactions?.length || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}