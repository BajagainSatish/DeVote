"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./common/Card"
import { Button } from "./common/Button"
import { Badge } from "./common/Badge"
import { Progress } from "./common/Progress"
import { ArrowRight, Play, RotateCcw, CheckCircle, XCircle } from "lucide-react"

export function ConsensusVisualizer({ nodes, phase, onPhaseChange }) {
  const [isRunning, setIsRunning] = useState(false)

  const startRealConsensus = async () => {
    const primaryNode = nodes.find(node => node.isPrimary && (node.status === "active" || node.status === "malicious"))
    if (!primaryNode) {
      alert("No active primary node found")
      return
    }

    setIsRunning(true)
    onPhaseChange("pre-prepare")

    try {
      // First, submit a vote to create pending transactions
      console.log("Submitting vote to create pending transaction...")
      const voteResponse = await fetch(`http://${primaryNode.address}:${primaryNode.port}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_id: `consensus_test_${Date.now()}`,
          candidate_id: `candidate_${Math.floor(Math.random() * 3) + 1}`
        })
      })

      if (!voteResponse.ok) {
        throw new Error("Failed to submit vote")
      }

      const voteResult = await voteResponse.json()
      console.log("Vote submitted:", voteResult)

      // Wait a moment for the vote to be processed
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Now try to start consensus
      console.log("Starting PBFT consensus...")
      const consensusResponse = await fetch(`http://${primaryNode.address}:${primaryNode.port}/pbft/start-consensus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (consensusResponse.ok) {
        const consensusResult = await consensusResponse.json()
        console.log("Consensus started:", consensusResult)
        
        // Simulate the phases for visualization
        setTimeout(() => onPhaseChange("prepare"), 1000)
        setTimeout(() => onPhaseChange("commit"), 3000)
        setTimeout(() => onPhaseChange("completed"), 5000)
        setTimeout(() => {
          onPhaseChange("idle")
          setIsRunning(false)
        }, 7000)
      } else {
        const errorText = await consensusResponse.text()
        console.error("Consensus failed:", errorText)
        alert(`Failed to start consensus: ${errorText}`)
        onPhaseChange("idle")
        setIsRunning(false)
      }
    } catch (error) {
      console.error("Error in consensus process:", error)
      alert(`Error: ${error.message}`)
      onPhaseChange("idle")
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Real PBFT Consensus Process
          <Button onClick={startRealConsensus} disabled={isRunning} size="sm">
            Start Real Consensus
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div>Phase: <strong>{phase}</strong></div>
          {isRunning && <div style={{ marginTop: "10px" }}>Running actual PBFT consensus...</div>}
        </div>
      </CardContent>
    </Card>
  )
}