export function Button({ children, onClick, variant = "default", size = "md" }) {
  const styles = {
    default: {
      backgroundColor: "#2563eb",
      color: "white",
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.875rem",
    },
    outline: {
      backgroundColor: "transparent",
      border: "1px solid #2563eb",
      color: "#2563eb",
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.875rem",
    },
  }

  const sizes = {
    sm: { padding: "4px 8px", fontSize: "0.75rem" },
    md: {},
    lg: { padding: "12px 20px", fontSize: "1rem" },
  }

  return (
    <button
      onClick={onClick}
      style={{ ...styles[variant], ...sizes[size] }}
    >
      {children}
    </button>
  )
}
