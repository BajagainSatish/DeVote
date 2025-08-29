import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, Shield, AlertTriangle } from "lucide-react"

export function NodeStatus({ node }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-chart-4 text-white"
      case "malicious":
        return "bg-chart-3 text-white"
      case "inactive":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <Server className="h-4 w-4" />
      case "malicious":
        return <AlertTriangle className="h-4 w-4" />
      case "inactive":
        return <Server className="h-4 w-4 opacity-50" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  return (
    <Card className="relative">
      {node.isPrimary && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-primary text-primary-foreground">
            <Shield className="h-3 w-3 mr-1" />
            Primary
          </Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getStatusIcon(node.status)}
          {node.id.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-muted-foreground">
          {node.address}:{node.port}
        </div>
        <Badge className={getStatusColor(node.status)} variant="secondary">
          {node.status.toUpperCase()}
        </Badge>
        {node.status === "active" && (
          <div className="text-xs space-y-1">
            <div>
              Height: <span className="font-mono">{node.height}</span>
            </div>
            <div>
              Hash: <span className="font-mono text-xs">{node.hash.slice(0, 8)}...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
