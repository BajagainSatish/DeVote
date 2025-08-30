"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./common/Card"
import { Button } from "./common/Button"
import { Badge } from "./common/Badge"
import { Progress } from "./common/Progress"
import { ArrowRight, Play, RotateCcw, CheckCircle, XCircle } from "lucide-react"

export function ConsensusVisualizer({ nodes, phase, onPhaseChange }) {
  const [validations, setValidations] = useState({})
  const [commitVotes, setCommitVotes] = useState({})
  const [isRunning, setIsRunning] = useState(false)

  const activeNodes = nodes.filter((n) => n.status === "active")
  const totalNodes = activeNodes.length
  const faultTolerance = Math.floor((totalNodes - 1) / 3)
  const requiredValidations = 2 * faultTolerance + 1

  const phases = [
    {
      phase: "pre-prepare",
      description: "Primary proposes block",
      completed: phase === "prepare" || phase === "commit" || phase === "completed",
      active: phase === "pre-prepare",
    },
    {
      phase: "prepare",
      description: `Validate (need ${requiredValidations}/${totalNodes})`,
      completed: phase === "commit" || phase === "completed",
      active: phase === "prepare",
    },
    {
      phase: "commit",
      description: `Commit (need ${requiredValidations}/${totalNodes})`,
      completed: phase === "completed",
      active: phase === "commit",
    },
  ]

  const startConsensus = async () => {
    if (activeNodes.length < 4) {
      alert("Need at least 4 active nodes for PBFT consensus")
      return
    }

    setIsRunning(true)
    setValidations({})
    setCommitVotes({})

    // Phase 1: Pre-prepare
    onPhaseChange("pre-prepare")
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Phase 2: Prepare
    onPhaseChange("prepare")
    const newValidations = {}

    for (const node of activeNodes) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const willValidate = node.status === "malicious" ? Math.random() > 0.8 : Math.random() > 0.1
      newValidations[node.id] = willValidate
      setValidations({ ...newValidations })
    }

    const validationCount = Object.values(newValidations).filter(Boolean).length

    if (validationCount >= requiredValidations) {
      // Phase 3: Commit
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onPhaseChange("commit")

      const newCommitVotes = {}
      for (const node of activeNodes) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        const willCommit = newValidations[node.id] && (node.status === "malicious" ? Math.random() > 0.7 : true)
        newCommitVotes[node.id] = willCommit
        setCommitVotes({ ...newCommitVotes })
      }

      const commitCount = Object.values(newCommitVotes).filter(Boolean).length

      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (commitCount >= requiredValidations) {
        onPhaseChange("completed")
      } else {
        onPhaseChange("idle")
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onPhaseChange("idle")
    }

    setIsRunning(false)
  }

  const resetConsensus = () => {
    onPhaseChange("idle")
    setValidations({})
    setCommitVotes({})
    setIsRunning(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span>PBFT Consensus Process</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button onClick={startConsensus} disabled={isRunning || activeNodes.length < 4} size="sm">
              <Play style={{ width: "16px", height: "16px" }} />
              Start
            </Button>
            <Button onClick={resetConsensus} variant="outline" size="sm">
              <RotateCcw style={{ width: "16px", height: "16px" }} />
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Phase Progress */}
        <div className="consensus-phases">
          {phases.map((phaseInfo) => (
            <div key={phaseInfo.phase}>
              <div className={`phase-card ${phaseInfo.completed ? 'completed' : ''} ${phaseInfo.active ? 'active' : ''}`}>
                <div className="phase-title">{phaseInfo.phase}</div>
                <div className="phase-description">{phaseInfo.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Vote Progress */}
        {(phase === "prepare" || phase === "commit" || phase === "completed") && (
          <div style={{ marginTop: "24px" }}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Validation Votes</span>
                <span>{Object.values(validations).filter(Boolean).length}/{requiredValidations}</span>
              </div>
              <Progress 
                value={(Object.values(validations).filter(Boolean).length / requiredValidations) * 100} 
              />
            </div>

            {(phase === "commit" || phase === "completed") && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>Commit Votes</span>
                  <span>{Object.values(commitVotes).filter(Boolean).length}/{requiredValidations}</span>
                </div>
                <Progress 
                  value={(Object.values(commitVotes).filter(Boolean).length / requiredValidations) * 100} 
                />
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {phase === "completed" && (
          <div style={{ 
            backgroundColor: "var(--success)", 
            color: "white", 
            padding: "16px", 
            borderRadius: "8px", 
            textAlign: "center",
            marginTop: "24px"
          }}>
            <CheckCircle style={{ width: "24px", height: "24px", margin: "0 auto 8px" }} />
            <div>Consensus Achieved!</div>
          </div>
        )}

        {phase === "idle" && Object.keys(validations).length > 0 && (
          <div style={{ 
            backgroundColor: "var(--danger)", 
            color: "white", 
            padding: "16px", 
            borderRadius: "8px", 
            textAlign: "center",
            marginTop: "24px"
          }}>
            <XCircle style={{ width: "24px", height: "24px", margin: "0 auto 8px" }} />
            <div>Consensus Failed</div>
            <div style={{ fontSize: "0.875rem" }}>
              Insufficient votes ({Object.values(validations).filter(Boolean).length}/{requiredValidations})
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}