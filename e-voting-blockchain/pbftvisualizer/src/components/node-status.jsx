import { Badge } from "./common/Badge"
import { Server, Shield, AlertTriangle } from "lucide-react"

export function NodeStatus({ node }) {
  const getStatusVariant = (status) => {
    switch (status) {
      case "active":
      case "demo":
        return "success"
      case "malicious":
        return "destructive"
      case "inactive":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
      case "demo":
        return <Server style={{ width: "16px", height: "16px" }} />
      case "malicious":
        return <AlertTriangle style={{ width: "16px", height: "16px" }} />
      case "inactive":
        return <Server style={{ width: "16px", height: "16px", opacity: 0.5 }} />
      default:
        return <Server style={{ width: "16px", height: "16px" }} />
    }
  }

  return (
    <div className={`node-card ${node.status} ${node.isPrimary ? "primary" : ""}`}>
      {node.isPrimary && (
        <div style={{ position: "absolute", top: "-8px", right: "-8px" }}>
          <Badge variant="default">
            <Shield style={{ width: "12px", height: "12px", marginRight: "4px" }} />
            Primary
          </Badge>
        </div>
      )}

      <div className="node-header">
        <div className="node-id">
          {getStatusIcon(node.status)}
          {node.id.toUpperCase()}
        </div>
      </div>

      <div className="node-info">
        <div className="node-detail">
          <span className="node-detail-label">Address:</span>
          <span className="node-detail-value">
            {node.address}:{node.port}
          </span>
        </div>

        <div style={{ marginTop: "8px" }}>
          <Badge variant={getStatusVariant(node.status)}>
            {node.status === "demo" ? "DEMO" : node.status.toUpperCase()}
          </Badge>
        </div>

        {(node.status === "active" || node.status === "demo") && (
          <div style={{ marginTop: "12px" }}>
            <div className="node-detail">
              <span className="node-detail-label">Height:</span>
              <span className="node-detail-value">{node.height}</span>
            </div>
            <div className="node-detail">
              <span className="node-detail-label">Hash:</span>
              <span className="node-detail-value">{node.hash.slice(0, 8)}...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
