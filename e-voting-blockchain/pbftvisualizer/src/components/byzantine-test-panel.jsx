"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./common/Card"
import { Button } from "./common/Button"
import { Badge } from "./common/Badge"
import { AlertTriangle, Play, RotateCcw } from "lucide-react"

export function ByzantineTestPanel({ nodes, onRefreshNodes }) {
  const [isTestRunning, setIsTestRunning] = useState(false)

  const setNodeBehavior = async (nodeId, behavior, maliciousRate = 0.8) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node || node.status === "inactive") {
      alert(`Node ${nodeId} is not active`)
      return
    }

    try {
      const response = await fetch(`http://${node.address}:${node.port}/pbft/behavior`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          behavior: behavior,
          malicious_rate: maliciousRate
        })
      })

      if (response.ok) {
        console.log(`Set ${nodeId} to ${behavior} behavior`)
        // Refresh nodes to get updated status
        setTimeout(() => onRefreshNodes(), 1000)
      } else {
        alert(`Failed to set behavior for ${nodeId}`)
      }
    } catch (error) {
      console.error(`Error setting behavior for ${nodeId}:`, error)
      alert(`Error setting behavior for ${nodeId}`)
    }
  }

  const runMaliciousTest = async (maliciousNodeIds) => {
    setIsTestRunning(true)

    // Set specified nodes to malicious
    for (const nodeId of maliciousNodeIds) {
      await setNodeBehavior(nodeId, "malicious", 0.8)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Set other nodes to honest
    const honestNodeIds = nodes
      .filter(n => n.status !== "inactive" && !maliciousNodeIds.includes(n.id))
      .map(n => n.id)

    for (const nodeId of honestNodeIds) {
      await setNodeBehavior(nodeId, "honest", 0.0)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsTestRunning(false)
  }

  const resetAllNodes = async () => {
    setIsTestRunning(true)
    
    for (const node of nodes.filter(n => n.status !== "inactive")) {
      await setNodeBehavior(node.id, "honest", 0.0)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsTestRunning(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Byzantine Fault Tolerance Testing</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          <Button 
            onClick={() => runMaliciousTest(["node2"])}
            disabled={isTestRunning}
            size="sm"
          >
            1 Malicious (Safe)
          </Button>
          <Button 
            onClick={resetAllNodes}
            variant="outline"
            disabled={isTestRunning}
            size="sm"
          >
            Reset To All Honest Nodes
          </Button>
        </div>
        
        {isTestRunning && (
          <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
            Configuring node behaviors...
          </div>
        )}

        <div style={{ 
          backgroundColor: "rgba(37, 99, 235, 0.1)", 
          padding: "16px", 
          borderRadius: "8px",
          fontSize: "0.875rem"
        }}>
          <strong>PBFT Rule:</strong> Can tolerate at most f = (n-1)/3 malicious nodes.<br/>
          With 4 nodes, can tolerate 1 malicious node maximum.
        </div>
      </CardContent>
    </Card>
  )
}