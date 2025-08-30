import { Badge } from "./common/Badge"
import { Server, Shield, AlertTriangle } from "lucide-react"

export // Mock components for demonstration - replace with your actual components
function NodeStatus({ node }) {
  const getStatusVariant = (status) => {
    switch (status) {
      case "active": return "success"
      case "malicious": return "destructive"
      case "inactive": return "outline"
      default: return "outline"
    }
  }

  return (
    <div style={{
      padding: "16px",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      position: "relative",
      backgroundColor: node.status === "malicious" ? "rgba(239, 68, 68, 0.1)" : "var(--surface)"
    }}>
      {node.isPrimary && (
        <div style={{ position: "absolute", top: "8px", right: "8px" }}>
          <Badge variant="default">Primary</Badge>
        </div>
      )}
      
      <div style={{ fontWeight: "600", marginBottom: "8px" }}>
        {node.id.toUpperCase()}
      </div>
      
      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
        {node.address}:{node.port}
      </div>
      
      <Badge variant={getStatusVariant(node.status)}>
        {node.status.toUpperCase()}
      </Badge>
      
      {(node.status === "active" || node.status === "malicious") && (
        <div style={{ marginTop: "12px", fontSize: "0.875rem" }}>
          <div>Height: {node.height}</div>
          <div>Hash: {node.hash.slice(0, 8)}...</div>
          {node.view !== undefined && <div>View: {node.view}</div>}
          {node.sequenceNum !== undefined && <div>Seq: {node.sequenceNum}</div>}
        </div>
      )}
    </div>
  )
}