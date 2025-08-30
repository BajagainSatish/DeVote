// ui/slider.jsx
export function Slider({ value = [50], onValueChange, min = 0, max = 100, step = 1, disabled = false, className = "" }) {
  const handleChange = (e) => {
    if (onValueChange) {
      onValueChange([parseFloat(e.target.value)])
    }
  }

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={handleChange}
      disabled={disabled}
      className={`slider ${className}`}
    />
  )
}