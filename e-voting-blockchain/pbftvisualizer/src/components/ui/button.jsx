const Button = ({ className, variant = "default", size = "default", ...props }) => {
  const getVariantClass = (variant) => {
    switch (variant) {
      case "destructive":
        return "button-destructive"
      case "outline":
        return "button-outline"
      case "secondary":
        return "button-outline" // Using outline style for secondary
      case "ghost":
        return "button-outline" // Using outline style for ghost
      case "link":
        return "button-outline" // Using outline style for link
      default:
        return "button-primary"
    }
  }

  const getSizeClass = (size) => {
    switch (size) {
      case "sm":
        return "button-sm"
      case "lg":
        return "button-lg"
      case "icon":
        return "button-icon"
      default:
        return ""
    }
  }

  return <button className={`button ${getVariantClass(variant)} ${getSizeClass(size)} ${className || ""}`} {...props} />
}

export { Button }
