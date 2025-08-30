// ui/badge.jsx  
export function Badge({ variant, children }) {
  const variants = {
    default: { backgroundColor: "#3b82f6", color: "white" },
    success: { backgroundColor: "#10b981", color: "white" },
    destructive: { backgroundColor: "#ef4444", color: "white" },
    outline: { backgroundColor: "transparent", color: "var(--text)", border: "1px solid var(--border, #e5e5e5)" }
  }

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "0.75rem",
      fontWeight: "500",
      ...variants[variant || "default"]
    }}>
      {children}
    </span>
  )
}