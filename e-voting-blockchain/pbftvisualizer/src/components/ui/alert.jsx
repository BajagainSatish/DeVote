// ui/alert.jsx
export function Alert({ children, className = "", variant = "info" }) {
  return (
    <div className={`alert alert-${variant} ${className}`}>
      {children}
    </div>
  )
}

export function AlertDescription({ children, className = "" }) {
  return (
    <div className={`alert-description ${className}`}>
      {children}
    </div>
  )
}