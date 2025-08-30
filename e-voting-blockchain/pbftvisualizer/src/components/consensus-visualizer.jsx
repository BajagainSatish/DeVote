"use client"

import { useState} from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./common/Card"
import { Button } from "./common/Button"
import { Badge } from "./common/Badge"
import { Progress } from "./common/Progress"
import { ArrowRight, Play, RotateCcw, CheckCircle, XCircle } from "lucide-react"

export function ConsensusVisualizer({ nodes, phase, onPhaseChange, onNodesUpdate, demoMode = false }) {
  const [isRunning, setIsRunning] = useState(false)
  const [consensusLog, setConsensusLog] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [useMockData, setUseMockData] = useState(false)

  const simulatePBFTPhases = async () => {
    setIsRunning(true)
    setConsensusLog([])
    setCurrentStep(0)

    const logMessage = (message, step) => {
      setConsensusLog(prev => [...prev, { message, timestamp: new Date().toLocaleTimeString(), step }])
      setCurrentStep(step)
    }

    try {
      // Phase 1: Pre-prepare
      onPhaseChange("pre-prepare")
      logMessage("PRIMARY: Broadcasting PRE-PREPARE message with new block", 1)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Phase 2: Prepare
      onPhaseChange("prepare")
      logMessage("BACKUPS: Validating block and broadcasting PREPARE messages", 2)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Phase 3: Commit
      onPhaseChange("commit")
      logMessage("ALL NODES: 2f+1 PREPARE messages received, broadcasting COMMIT", 3)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Phase 4: Committed
      onPhaseChange("committed")
      logMessage("SUCCESS: Block committed to blockchain across all honest nodes", 4)
      
      // Add mock block if using mock data or trigger blockchain update
      if (useMockData || demoMode) {
        if (window.addMockBlock) {
          window.addMockBlock(true) // true indicates consensus block
        }
        // Update node heights to show consensus success
        const updatedNodes = nodes.map(node => ({
          ...node,
          height: node.status !== "inactive" ? node.height + 1 : node.height,
          sequenceNum: node.status !== "inactive" ? (node.sequenceNum || 0) + 1 : node.sequenceNum
        }))
        onNodesUpdate(updatedNodes)
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Reset
      onPhaseChange("idle")
      logMessage("CONSENSUS ROUND COMPLETED - Ready for next transaction", 5)
      setIsRunning(false)

    } catch (error) {
      console.error("Error in consensus simulation:", error)
      onPhaseChange("idle")
      setIsRunning(false)
    }
  }

  const startRealConsensus = async () => {
    const primaryNode = nodes.find(node => node.isPrimary && (node.status === "active" || node.status === "malicious"))
    if (!primaryNode) {
      alert("No active primary node found - switching to mock mode")
      setUseMockData(true)
      simulatePBFTPhases()
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
        throw new Error("Failed to submit vote - switching to mock mode")
      }

      const voteResult = await voteResponse.json()
      console.log("Vote submitted:", voteResult)

      // Wait longer for the vote to be processed
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Check if there are pending transactions
      const pendingResponse = await fetch(`http://${primaryNode.address}:${primaryNode.port}/blockchain/pending`)
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        console.log("Pending transactions:", pendingData.pending_count)
        
        if (pendingData.pending_count === 0) {
          console.log("No pending transactions found, using simulation mode")
          setUseMockData(true)
          simulatePBFTPhases()
          return
        }
      }

      // Try to start consensus
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
        const errorData = await consensusResponse.json()
        console.error("Consensus failed:", errorData)
        
        // Fall back to mock mode
        console.log("Backend consensus failed, using mock simulation")
        setUseMockData(true)
        simulatePBFTPhases()
      }
    } catch (error) {
      console.error("Error in consensus process:", error)
      console.log("Network error, falling back to simulation")
      simulatePBFTPhases()
    }
  }

  const resetConsensus = () => {
    onPhaseChange("idle")
    setIsRunning(false)
    setConsensusLog([])
    setCurrentStep(0)
  }

  const getPhaseColor = (phaseName) => {
    if (phase === phaseName) return "var(--primary)"
    if (currentStep > getPhaseStep(phaseName)) return "var(--success)"
    return "var(--text-secondary)"
  }

  const getPhaseStep = (phaseName) => {
    const phaseMap = { "pre-prepare": 1, "prepare": 2, "commit": 3, "committed": 4, "completed": 5 }
    return phaseMap[phaseName] || 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          PBFT Consensus Process
          <div style={{ display: "flex", gap: "8px" }}>
            {useMockData}
            <Button onClick={startRealConsensus} disabled={isRunning} size="sm">
              <Play style={{ width: "16px", height: "16px", marginRight: "4px" }} />
              {useMockData ? "Simulate PBFT" : "Start Consensus"}
            </Button>
            <Button onClick={resetConsensus} disabled={isRunning} variant="outline" size="sm">
              <RotateCcw style={{ width: "16px", height: "16px" }} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Phase Progress */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "50%", 
                backgroundColor: getPhaseColor("pre-prepare"),
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px"
              }}>1</div>
              <div style={{ fontSize: "0.875rem", color: getPhaseColor("pre-prepare") }}>
                Pre-Prepare
              </div>
            </div>
            
            <ArrowRight style={{ width: "20px", height: "20px", color: "var(--text-secondary)" }} />
            
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "50%", 
                backgroundColor: getPhaseColor("prepare"),
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px"
              }}>2</div>
              <div style={{ fontSize: "0.875rem", color: getPhaseColor("prepare") }}>
                Prepare
              </div>
            </div>
            
            <ArrowRight style={{ width: "20px", height: "20px", color: "var(--text-secondary)" }} />
            
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "50%", 
                backgroundColor: getPhaseColor("commit"),
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px"
              }}>3</div>
              <div style={{ fontSize: "0.875rem", color: getPhaseColor("commit") }}>
                Commit
              </div>
            </div>
            
            <ArrowRight style={{ width: "20px", height: "20px", color: "var(--text-secondary)" }} />
            
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "50%", 
                backgroundColor: getPhaseColor("committed"),
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px"
              }}>4</div>
              <div style={{ fontSize: "0.875rem", color: getPhaseColor("committed") }}>
                Committed
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={currentStep * 20} style={{ height: "8px" }} />
        </div>

        {/* Current Phase Info */}
        <div style={{ 
          padding: "16px", 
          backgroundColor: "var(--surface)", 
          borderRadius: "8px",
          marginBottom: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Badge variant={phase === "idle" ? "outline" : "default"}>
              {phase === "idle" ? "Waiting" : phase.toUpperCase()}
            </Badge>
            {phase === "completed" && <CheckCircle style={{ width: "20px", height: "20px", color: "var(--success)" }} />}
          </div>
          
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {phase === "idle" && "Ready to start consensus process"}
            {phase === "pre-prepare" && "Primary node broadcasting block proposal to all backup nodes"}
            {phase === "prepare" && "Backup nodes validating and broadcasting PREPARE messages"}
            {phase === "commit" && "Nodes received 2f+1 PREPARE messages, broadcasting COMMIT"}
            {phase === "committed" && "Block successfully committed across honest nodes"}
            {phase === "completed" && "Consensus round completed successfully"}
          </div>
        </div>

        {/* Consensus Log */}
        {consensusLog.length > 0 && (
          <div style={{ 
            border: "1px solid var(--border)", 
            borderRadius: "8px",
            maxHeight: "200px",
            overflowY: "auto"
          }}>
            <div style={{ 
              padding: "8px 12px", 
              backgroundColor: "var(--surface)", 
              borderBottom: "1px solid var(--border)",
              fontWeight: "600",
              fontSize: "0.875rem"
            }}>
              Consensus Log
            </div>
            {consensusLog.map((entry, index) => (
              <div key={index} style={{ 
                padding: "8px 12px", 
                borderBottom: index < consensusLog.length - 1 ? "1px solid var(--border)" : "none",
                fontSize: "0.875rem",
                color: entry.step === currentStep ? "var(--primary)" : "var(--text-secondary)"
              }}>
                <span style={{ color: "var(--text-secondary)" }}>[{entry.timestamp}]</span> {entry.message}
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  )
}