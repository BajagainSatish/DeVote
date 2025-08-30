// ui/card.jsx
export function Card({ children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`card-header ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = "" }) {
  return (
    <h2 className={`card-title ${className}`}>
      {children}
    </h2>
  )
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={`card-content ${className}`}>
      {children}
    </div>
  )
}