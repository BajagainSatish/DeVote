"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./common/Card"
import { Button } from "./common/Button"
import { Badge } from "./common/Badge"
import { AlertTriangle, Play, RotateCcw } from "lucide-react"

export function ByzantineTestPanel({ nodes, onNodesUpdate }) {
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testResults, setTestResults] = useState(null)

  const activeNodes = nodes.filter((n) => n.status !== "inactive")
  const totalNodes = activeNodes.length
  const faultTolerance = Math.floor((totalNodes - 1) / 3)
  const maliciousNodes = nodes.filter((n) => n.status === "malicious")

  // const toggleNodeMalicious = (nodeId) => {
  //   const updatedNodes = nodes.map((node) => ({
  //     ...node,
  //     status: node.id === nodeId 
  //       ? (node.status === "malicious" ? "active" : "malicious") 
  //       : node.status,
  //   }))
  //   onNodesUpdate(updatedNodes)
  // }

  const runTest = async (maliciousNodeIds) => {
    setIsTestRunning(true)
    setTestResults(null)

    // Set nodes to malicious
    const updatedNodes = nodes.map((node) => ({
      ...node,
      status: maliciousNodeIds.includes(node.id) ? "malicious" : "active",
    }))
    onNodesUpdate(updatedNodes)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const maliciousCount = maliciousNodeIds.length
    const requiredVotes = 2 * faultTolerance + 1
    const honestVotes = totalNodes - maliciousCount
    
    // Simulate random malicious behavior
    let totalVotes = honestVotes
    for (let i = 0; i < maliciousCount; i++) {
      if (Math.random() > 0.8) totalVotes++ // 20% chance malicious node votes honestly
    }

    const success = totalVotes >= requiredVotes

    setTestResults({
      maliciousCount,
      totalVotes,
      requiredVotes,
      success,
      expected: maliciousCount <= faultTolerance
    })

    setIsTestRunning(false)
  }

  const resetAllNodes = () => {
    const resetNodes = nodes.map((node) => ({ ...node, status: "active" }))
    onNodesUpdate(resetNodes)
    setTestResults(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <AlertTriangle style={{ width: "20px", height: "20px" }} />
          Byzantine Testing
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Info */}
        <div style={{ 
          backgroundColor: "rgba(37, 99, 235, 0.1)", 
          padding: "16px", 
          borderRadius: "8px", 
          marginBottom: "24px",
          border: "1px solid rgba(37, 99, 235, 0.2)"
        }}>
          <div style={{ fontWeight: "600", marginBottom: "8px" }}>
            PBFT Rule: f &lt; n/3
          </div>
          <div style={{ fontSize: "0.875rem" }}>
            With {totalNodes} nodes, can tolerate at most {faultTolerance} malicious nodes.
            {maliciousNodes.length > faultTolerance && (
              <div style={{ color: "var(--danger)", fontWeight: "600", marginTop: "4px" }}>
                Currently {maliciousNodes.length} malicious nodes exceed limit!
              </div>
            )}
          </div>
        </div>

        {/* Node Controls */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "16px", fontWeight: "600" }}>Node Controls</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {activeNodes.map((node) => (
              <div key={node.id} style={{ 
                padding: "16px", 
                border: "1px solid var(--border)", 
                borderRadius: "8px",
                backgroundColor: node.status === "malicious" ? "rgba(239, 68, 68, 0.1)" : "var(--surface)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "600" }}>{node.id.toUpperCase()}</span>
                  {/* <Button 
                    onClick={() => toggleNodeMalicious(node.id)}
                    variant={node.status === "malicious" ? "outline" : "primary"}
                    size="sm"
                  >
                    {node.status === "malicious" ? "Make Honest" : "Make Malicious"}
                  </Button> */}
                </div>
                <Badge variant={node.status === "malicious" ? "destructive" : "success"}>
                  {node.status === "malicious" ? "MALICIOUS" : "HONEST"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Test Scenarios */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "16px", fontWeight: "600" }}>Quick Tests</h3>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Button 
              onClick={() => runTest(["node3"])}
              disabled={isTestRunning}
              size="sm"
            >
              1 Malicious (Safe)
            </Button>
            <Button 
              onClick={() => runTest(["node3", "node4"])}
              disabled={isTestRunning}
              size="sm"
            >
              2 Malicious (Unsafe)
            </Button>
            <Button 
              onClick={resetAllNodes}
              variant="outline"
              disabled={isTestRunning}
              size="sm"
            >
              <RotateCcw style={{ width: "14px", height: "14px" }} />
              Reset All
            </Button>
          </div>
        </div>

        {/* Results */}
        {testResults && (
          <div style={{ 
            padding: "16px", 
            borderRadius: "8px", 
            backgroundColor: testResults.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${testResults.success ? "var(--success)" : "var(--danger)"}`,
            marginTop: "16px"
          }}>
            <div style={{ fontWeight: "600", marginBottom: "8px" }}>
              Test Result: {testResults.success ? "SUCCESS" : "FAILED"}
            </div>
            <div style={{ fontSize: "0.875rem" }}>
              {testResults.totalVotes}/{testResults.requiredVotes} votes received with {testResults.maliciousCount} malicious nodes
            </div>
          </div>
        )}

        {isTestRunning && (
          <div style={{ textAlign: "center", padding: "16px", color: "var(--text-secondary)" }}>
            Running test scenario...
          </div>
        )}
      </CardContent>
    </Card>
  )
}