"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Play, RotateCcw, CheckCircle, XCircle, Info } from "lucide-react"

export function ByzantineTestPanel({ nodes, onNodesUpdate }) {
  const [maliciousRates, setMaliciousRates] = useState({})
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testResults, setTestResults] = useState(null)

  const activeNodes = nodes.filter((n) => n.status !== "inactive")
  const totalNodes = activeNodes.length
  const faultTolerance = Math.floor((totalNodes - 1) / 3)
  const maliciousNodes = nodes.filter((n) => n.status === "malicious")

  const testScenarios = [
    {
      name: "Safe Operation",
      description: "1 malicious node out of 4 total",
      maliciousNodes: ["node3"],
      expectedResult: "success",
      explanation: "With f=1 and n=4, we have f < n/3 (1 < 1.33), so consensus should succeed",
    },
    {
      name: "Byzantine Fault",
      description: "2 malicious nodes out of 4 total",
      maliciousNodes: ["node3", "node4"],
      expectedResult: "failure",
      explanation: "With f=2 and n=4, we have f >= n/3 (2 >= 1.33), so consensus should fail",
    },
    {
      name: "Majority Attack",
      description: "3 malicious nodes out of 4 total",
      maliciousNodes: ["node2", "node3", "node4"],
      expectedResult: "failure",
      explanation: "With f=3 and n=4, malicious nodes control the majority, consensus will fail",
    },
  ]

  const toggleNodeMalicious = (nodeId, isMalicious) => {
    const updatedNodes = nodes.map((node) => ({
      ...node,
      status: node.id === nodeId ? (isMalicious ? "malicious" : "active") : node.status,
    }))
    onNodesUpdate(updatedNodes)

    if (!isMalicious) {
      const newRates = { ...maliciousRates }
      delete newRates[nodeId]
      setMaliciousRates(newRates)
    } else {
      setMaliciousRates({ ...maliciousRates, [nodeId]: 0.8 })
    }
  }

  const updateMaliciousRate = (nodeId, rate) => {
    setMaliciousRates({ ...maliciousRates, [nodeId]: rate })
  }

  const runTestScenario = async (scenario) => {
    setIsTestRunning(true)
    setTestResults(null)

    // Reset all nodes to active first
    const resetNodes = nodes.map((node) => ({ ...node, status: "active" }))
    onNodesUpdate(resetNodes)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Set malicious nodes
    const updatedNodes = resetNodes.map((node) => ({
      ...node,
      status: scenario.maliciousNodes.includes(node.id) ? "malicious" : "active",
    }))
    onNodesUpdate(updatedNodes)

    // Update malicious rates
    const newRates = {}
    scenario.maliciousNodes.forEach((nodeId) => {
      newRates[nodeId] = 0.8
    })
    setMaliciousRates(newRates)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate consensus attempt
    const maliciousCount = scenario.maliciousNodes.length
    const honestCount = totalNodes - maliciousCount
    const requiredVotes = 2 * faultTolerance + 1

    // Simulate voting behavior
    let successfulVotes = 0

    // Honest nodes always vote correctly
    successfulVotes += honestCount

    // Malicious nodes vote randomly based on their rate
    for (let i = 0; i < maliciousCount; i++) {
      if (Math.random() > 0.8) {
        // 20% chance malicious node votes correctly
        successfulVotes++
      }
    }

    const consensusAchieved = successfulVotes >= requiredVotes
    const actualResult = consensusAchieved ? "success" : "failure"

    setTestResults({
      scenario: scenario.name,
      result: actualResult,
      details: `${successfulVotes}/${requiredVotes} votes received. ${
        actualResult === scenario.expectedResult ? "Expected result achieved" : "Unexpected result"
      }`,
    })

    setIsTestRunning(false)
  }

  const resetAllNodes = () => {
    const resetNodes = nodes.map((node) => ({ ...node, status: "active" }))
    onNodesUpdate(resetNodes)
    setMaliciousRates({})
    setTestResults(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Byzantine Fault Tolerance Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Byzantine Fault Tolerance Theory */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">PBFT Fault Tolerance Formula: f &lt; n/3</div>
              <div className="text-sm">
                With {totalNodes} nodes, we can tolerate at most {faultTolerance} malicious node(s).
                {maliciousNodes.length > faultTolerance && (
                  <span className="text-destructive font-medium">
                    {" "}
                    Currently {maliciousNodes.length} malicious nodes exceed the limit!
                  </span>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Node Configuration */}
        <div className="space-y-4">
          <h3 className="font-medium">Node Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeNodes.map((node) => {
              const isMalicious = node.status === "malicious"
              const maliciousRate = maliciousRates[node.id] || 0.8

              return (
                <Card key={node.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{node.id.toUpperCase()}</span>
                        {node.isPrimary && <Badge variant="outline">Primary</Badge>}
                      </div>
                      <Switch
                        checked={isMalicious}
                        onCheckedChange={(checked) => toggleNodeMalicious(node.id, checked)}
                        disabled={isTestRunning}
                      />
                    </div>

                    <Badge variant={isMalicious ? "destructive" : "default"}>
                      {isMalicious ? "Malicious" : "Honest"}
                    </Badge>

                    {isMalicious && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Malicious Rate:</span>
                          <span className="font-mono">{Math.round(maliciousRate * 100)}%</span>
                        </div>
                        <Slider
                          value={[maliciousRate]}
                          onValueChange={([value]) => updateMaliciousRate(node.id, value)}
                          min={0.1}
                          max={1.0}
                          step={0.1}
                          disabled={isTestRunning}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="space-y-4">
          <h3 className="font-medium">Predefined Test Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testScenarios.map((scenario) => (
              <Card key={scenario.name} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{scenario.name}</h4>
                    <Badge variant={scenario.expectedResult === "success" ? "default" : "destructive"}>
                      {scenario.expectedResult === "success" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {scenario.expectedResult}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  <p className="text-xs text-muted-foreground">{scenario.explanation}</p>
                  <Button
                    onClick={() => runTestScenario(scenario)}
                    disabled={isTestRunning}
                    size="sm"
                    className="w-full"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Run Test
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="font-medium mb-1">Total Nodes</div>
            <div className="text-2xl font-bold">{totalNodes}</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="font-medium mb-1">Malicious Nodes</div>
            <div className="text-2xl font-bold text-destructive">{maliciousNodes.length}</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="font-medium mb-1">Fault Tolerance</div>
            <div className="text-2xl font-bold">
              {maliciousNodes.length <= faultTolerance ? (
                <span className="text-chart-4">{faultTolerance}</span>
              ) : (
                <span className="text-destructive">Exceeded</span>
              )}
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <Alert className={testResults.result === "success" ? "border-chart-4" : "border-destructive"}>
            <div className="flex items-center gap-2">
              {testResults.result === "success" ? (
                <CheckCircle className="h-4 w-4 text-chart-4" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <AlertDescription>
                <div className="font-medium">{testResults.scenario} Test Result</div>
                <div className="text-sm">{testResults.details}</div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button onClick={resetAllNodes} variant="outline" disabled={isTestRunning}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset All Nodes
          </Button>
          {isTestRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Running test scenario...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
