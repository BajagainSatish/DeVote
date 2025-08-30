// ui/button.jsx
export function Button({ onClick, variant, size, disabled, children, style }) {
  const variants = {
    primary: { backgroundColor: "#3b82f6", color: "white", border: "none" },
    outline: { backgroundColor: "transparent", color: "var(--text)", border: "1px solid var(--border, #e5e5e5)" }
  }

  const sizes = {
    sm: { padding: "6px 12px", fontSize: "0.875rem" }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: "6px",
        fontWeight: "500",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        padding: "8px 16px",
        ...variants[variant || "primary"],
        ...sizes[size],
        ...style
      }}
    >
      {children}
    </button>
  )
}