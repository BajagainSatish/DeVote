export function Badge({ children, variant = "default" }) {
  const styles = {
    default: {
      backgroundColor: "#e0e7ff",
      color: "#1e3a8a",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "0.875rem",
      fontWeight: "500",
    },
    destructive: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "0.875rem",
      fontWeight: "500",
    },
    outline: {
      border: "1px solid #d1d5db",
      color: "#374151",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "0.875rem",
      fontWeight: "500",
    },
  }

  return <span style={styles[variant] || styles.default}>{children}</span>
}
