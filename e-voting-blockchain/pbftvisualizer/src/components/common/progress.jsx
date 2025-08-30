export function Progress({ value = 0, max = 100 }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  return (
    <div className="progress">
      <div 
        className="progress-bar" 
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}