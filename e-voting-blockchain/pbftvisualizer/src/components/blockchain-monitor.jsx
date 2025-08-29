"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Database, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export function BlockchainMonitor({ nodes }) {
  const [blockchainData, setBlockchainData] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const activeNodes = nodes.filter((n) => n.status !== "inactive")

  // Mock genesis block - in real implementation this would come from the backend
  const genesisBlock = {
    height: 0,
    hash: "0000000000000000000000000000000000000000000000000000000000000000",
    previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
    timestamp: "2024-01-01T00:00:00Z",
    data: "Genesis Block - PBFT Blockchain",
    validator: "genesis",
  }

  const fetchBlockchainData = async () => {
    setIsLoading(true)
    const newBlockchainData = {}

    for (const node of activeNodes) {
      try {
        // In real implementation, this would fetch from the actual node API
        // For demo purposes, we'll simulate blockchain data
        const mockBlocks = generateMockBlockchain(node)
        newBlockchainData[node.id] = mockBlocks
      } catch (error) {
        console.log(`[v0] Failed to fetch blockchain data from ${node.id}:`, error)
        newBlockchainData[node.id] = [genesisBlock]
      }
    }

    setBlockchainData(newBlockchainData)
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  const generateMockBlockchain = (node) => {
    const blocks = [genesisBlock]

    // Generate some mock blocks based on node height
    for (let i = 1; i <= node.height; i++) {
      const previousBlock = blocks[i - 1]
      const block = {
        height: i,
        hash: generateMockHash(i, node.id),
        previousHash: previousBlock.hash,
        timestamp: new Date(Date.now() - (node.height - i) * 60000).toISOString(),
        data: `Block ${i} - Transaction Data`,
        validator: node.isPrimary ? node.id : `node${(i % 4) + 1}`,
      }
      blocks.push(block)
    }

    return blocks
  }

  const generateMockHash = (height, nodeId) => {
    // Generate a consistent mock hash based on height and node
    const seed = height * 1000 + nodeId.charCodeAt(nodeId.length - 1)
    return seed.toString(16).padStart(64, "0").slice(0, 64)
  }

  useEffect(() => {
    if (activeNodes.length > 0) {
      fetchBlockchainData()
    }
  }, [nodes])

  const checkSynchronization = () => {
    if (Object.keys(blockchainData).length < 2) return { synchronized: true, details: "Insufficient data" }

    const nodeIds = Object.keys(blockchainData)
    const firstNodeBlocks = blockchainData[nodeIds[0]]

    for (let i = 1; i < nodeIds.length; i++) {
      const currentNodeBlocks = blockchainData[nodeIds[i]]

      if (firstNodeBlocks.length !== currentNodeBlocks.length) {
        return {
          synchronized: false,
          details: `Height mismatch: ${nodeIds[0]} has ${firstNodeBlocks.length} blocks, ${nodeIds[i]} has ${currentNodeBlocks.length} blocks`,
        }
      }

      for (let j = 0; j < firstNodeBlocks.length; j++) {
        if (firstNodeBlocks[j].hash !== currentNodeBlocks[j].hash) {
          return {
            synchronized: false,
            details: `Hash mismatch at block ${j}: different block hashes between nodes`,
          }
        }
      }
    }

    return { synchronized: true, details: "All nodes synchronized" }
  }

  const syncStatus = checkSynchronization()

  const checkGenesisConsistency = () => {
    const nodeIds = Object.keys(blockchainData)
    if (nodeIds.length === 0) return { consistent: true, details: "No data available" }

    const genesisHashes = nodeIds.map((nodeId) => blockchainData[nodeId]?.[0]?.hash).filter(Boolean)

    if (genesisHashes.length === 0) return { consistent: true, details: "No genesis blocks found" }

    const allSame = genesisHashes.every((hash) => hash === genesisHashes[0])

    return {
      consistent: allSame,
      details: allSame ? "All nodes have identical genesis blocks" : "Genesis block mismatch detected",
    }
  }

  const genesisStatus = checkGenesisConsistency()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Blockchain State Monitor
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">Updated: {lastUpdated.toLocaleTimeString()}</span>
            )}
            <Button onClick={fetchBlockchainData} disabled={isLoading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Synchronization Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {syncStatus.synchronized ? (
                <CheckCircle className="h-5 w-5 text-chart-4" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="font-medium">Network Synchronization</span>
            </div>
            <Badge variant={syncStatus.synchronized ? "default" : "destructive"}>
              {syncStatus.synchronized ? "Synchronized" : "Out of Sync"}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">{syncStatus.details}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {genesisStatus.consistent ? (
                <CheckCircle className="h-5 w-5 text-chart-4" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-chart-5" />
              )}
              <span className="font-medium">Genesis Block Verification</span>
            </div>
            <Badge variant={genesisStatus.consistent ? "default" : "secondary"}>
              {genesisStatus.consistent ? "Consistent" : "Inconsistent"}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">{genesisStatus.details}</p>
          </Card>
        </div>

        {/* Node Blockchain States */}
        <Tabs defaultValue={activeNodes[0]?.id || "none"} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {activeNodes.map((node) => (
              <TabsTrigger key={node.id} value={node.id} className="flex items-center gap-1">
                {node.id.toUpperCase()}
                {node.status === "malicious" && <AlertTriangle className="h-3 w-3 text-destructive" />}
              </TabsTrigger>
            ))}
          </TabsList>

          {activeNodes.map((node) => (
            <TabsContent key={node.id} value={node.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {node.id.toUpperCase()} Blockchain State
                  {node.isPrimary && <Badge className="ml-2">Primary</Badge>}
                  {node.status === "malicious" && (
                    <Badge variant="destructive" className="ml-2">
                      Malicious
                    </Badge>
                  )}
                </h3>
                <div className="text-sm text-muted-foreground">
                  Height: {blockchainData[node.id]?.length - 1 || 0} blocks
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {blockchainData[node.id]?.map((block) => (
                  <Card key={`${node.id}-${block.height}`} className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Block {block.height}</span>
                          {block.height === 0 && <Badge variant="outline">Genesis</Badge>}
                        </div>
                        <div className="text-muted-foreground">
                          Hash: <span className="font-mono text-xs">{block.hash.slice(0, 16)}...</span>
                        </div>
                        <div className="text-muted-foreground">
                          Previous: <span className="font-mono text-xs">{block.previousHash.slice(0, 16)}...</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">
                          Timestamp: {new Date(block.timestamp).toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">Validator: {block.validator}</div>
                        <div className="text-muted-foreground">Data: {block.data}</div>
                      </div>
                    </div>
                  </Card>
                )) || (
                  <div className="text-center text-muted-foreground py-8">
                    No blockchain data available for this node
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Network Summary */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Network Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Active Nodes</div>
              <div className="text-2xl font-bold text-chart-4">{activeNodes.length}</div>
            </div>
            <div>
              <div className="font-medium">Max Height</div>
              <div className="text-2xl font-bold">
                {Math.max(...Object.values(blockchainData).map((blocks) => blocks.length - 1), 0)}
              </div>
            </div>
            <div>
              <div className="font-medium">Malicious Nodes</div>
              <div className="text-2xl font-bold text-destructive">
                {activeNodes.filter((n) => n.status === "malicious").length}
              </div>
            </div>
            <div>
              <div className="font-medium">Sync Status</div>
              <div className={`text-2xl font-bold ${syncStatus.synchronized ? "text-chart-4" : "text-destructive"}`}>
                {syncStatus.synchronized ? "OK" : "FAIL"}
              </div>
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  )
}
