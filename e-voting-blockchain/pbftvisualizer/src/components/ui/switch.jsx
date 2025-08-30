// ui/switch.jsx
export function Switch({ checked = false, onCheckedChange, disabled = false, className = "" }) {
  return (
    <label className={`switch ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="switch-slider"></span>
    </label>
  )
}