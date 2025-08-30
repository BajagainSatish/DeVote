// ui/button.jsx
export function Button({ children, onClick, variant = "primary", size = "md", disabled = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`button button-${variant} button-${size} ${className}`}
    >
      {children}
    </button>
  )
}