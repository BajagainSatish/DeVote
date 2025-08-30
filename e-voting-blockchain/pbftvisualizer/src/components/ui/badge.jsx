// ui/badge.jsx  
export function Badge({ children, variant = "default", className = "" }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  )
}