export function Card({ children, style }) {
  return (
    <div style={{
      backgroundColor: "var(--surface, #ffffff)",
      border: "1px solid var(--border, #e5e5e5)",
      borderRadius: "8px",
      marginBottom: "24px",
      ...style
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ children }) {
  return (
    <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border, #e5e5e5)" }}>
      {children}
    </div>
  )
}

export function CardContent({ children, style }) {
  return (
    <div style={{ padding: "24px", ...style }}>
      {children}
    </div>
  )
}

export function CardTitle({ children }) {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      fontSize: "1.125rem",
      fontWeight: "600"
    }}>
      {children}
    </div>
  )
}