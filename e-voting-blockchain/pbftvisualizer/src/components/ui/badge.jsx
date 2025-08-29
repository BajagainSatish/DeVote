const Badge = ({ className, variant = "default", ...props }) => {
  const getVariantClass = (variant) => {
    switch (variant) {
      case "destructive":
        return "badge-destructive"
      case "outline":
        return "badge-outline"
      case "success":
        return "badge-success"
      case "warning":
        return "badge-warning"
      default:
        return "badge-default"
    }
  }

  return <div className={`badge ${getVariantClass(variant)} ${className || ""}`} {...props} />
}

export { Badge }
