"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
      description: "Primary node proposes new block",
      completed: phase === "prepare" || phase === "commit" || phase === "completed",
      active: phase === "pre-prepare",
    },
    {
      phase: "prepare",
      description: `Nodes validate block (need ${requiredValidations}/${totalNodes})`,
      completed: phase === "commit" || phase === "completed",
      active: phase === "prepare",
    },
    {
      phase: "commit",
      description: `Nodes commit block (need ${requiredValidations}/${totalNodes})`,
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

    // Phase 2: Prepare (validation)
    onPhaseChange("prepare")
    const newValidations = {}

    for (const node of activeNodes) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      // Simulate validation - malicious nodes have 80% chance to reject
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
        // Nodes that validated will commit (unless malicious)
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

  const getNodeValidationStatus = (nodeId) => {
    if (phase === "prepare" || phase === "commit" || phase === "completed") {
      if (validations[nodeId] === true) return "validated"
      if (validations[nodeId] === false) return "rejected"
    }
    return "pending"
  }

  const getNodeCommitStatus = (nodeId) => {
    if (phase === "commit" || phase === "completed") {
      if (commitVotes[nodeId] === true) return "committed"
      if (commitVotes[nodeId] === false) return "refused"
    }
    return "pending"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>PBFT Consensus Process</span>
          <div className="flex gap-2">
            <Button onClick={startConsensus} disabled={isRunning || activeNodes.length < 4} size="sm">
              <Play className="h-4 w-4 mr-1" />
              Start Consensus
            </Button>
            <Button onClick={resetConsensus} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fault Tolerance Info */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Nodes:</span> {totalNodes}
            </div>
            <div>
              <span className="font-medium">Fault Tolerance (f):</span> {faultTolerance}
            </div>
            <div>
              <span className="font-medium">Required Votes (2f+1):</span> {requiredValidations}
            </div>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="space-y-4">
          <h3 className="font-medium">Consensus Phases</h3>
          <div className="space-y-3">
            {phases.map((phaseInfo, index) => (
              <div key={phaseInfo.phase} className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      phaseInfo.completed
                        ? "bg-chart-4 text-white"
                        : phaseInfo.active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {phaseInfo.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium capitalize">{phaseInfo.phase}</div>
                    <div className="text-sm text-muted-foreground">{phaseInfo.description}</div>
                  </div>
                </div>
                {index < phases.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Node Participation and Vote Counts sections remain the same */}
        {(phase === "prepare" || phase === "commit" || phase === "completed") && (
          <div className="space-y-4">
            <h3 className="font-medium">Node Participation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeNodes.map((node) => {
                const validationStatus = getNodeValidationStatus(node.id)
                const commitStatus = getNodeCommitStatus(node.id)

                return (
                  <Card key={node.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{node.id.toUpperCase()}</span>
                        {node.isPrimary && <Badge variant="outline">Primary</Badge>}
                      </div>

                      {/* Validation Status */}
                      <div className="flex items-center gap-2 text-xs">
                        <span>Validation:</span>
                        <Badge
                          variant={
                            validationStatus === "validated"
                              ? "default"
                              : validationStatus === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {validationStatus === "validated" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {validationStatus === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                          {validationStatus}
                        </Badge>
                      </div>

                      {/* Commit Status */}
                      {(phase === "commit" || phase === "completed") && (
                        <div className="flex items-center gap-2 text-xs">
                          <span>Commit:</span>
                          <Badge
                            variant={
                              commitStatus === "committed"
                                ? "default"
                                : commitStatus === "refused"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {commitStatus === "committed" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {commitStatus === "refused" && <XCircle className="h-3 w-3 mr-1" />}
                            {commitStatus}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Vote Counts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="font-medium mb-2">Validation Votes</div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(Object.values(validations).filter(Boolean).length / requiredValidations) * 100}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono">
                    {Object.values(validations).filter(Boolean).length}/{requiredValidations}
                  </span>
                </div>
              </div>

              {(phase === "commit" || phase === "completed") && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="font-medium mb-2">Commit Votes</div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(Object.values(commitVotes).filter(Boolean).length / requiredValidations) * 100}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono">
                      {Object.values(commitVotes).filter(Boolean).length}/{requiredValidations}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {phase === "completed" && (
          <div className="bg-chart-4 text-white p-4 rounded-lg text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Consensus Achieved!</div>
            <div className="text-sm opacity-90">Block successfully committed to blockchain</div>
          </div>
        )}

        {phase === "idle" && Object.keys(validations).length > 0 && (
          <div className="bg-chart-3 text-white p-4 rounded-lg text-center">
            <XCircle className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Consensus Failed</div>
            <div className="text-sm opacity-90">
              Insufficient votes ({Object.values(validations).filter(Boolean).length}/{requiredValidations} required)
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
