import { cn } from "../../lib/utils.js"

const Alert = ({ className, variant = "default", ...props }) => {
  const variants = {
    default: "bg-blue-50 border-blue-200 text-blue-900",
    destructive: "bg-red-50 border-red-200 text-red-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
    success: "bg-green-50 border-green-200 text-green-900",
  }

  return (
    <div
      className={cn("relative w-full rounded-lg border px-4 py-3 text-sm", variants[variant], className)}
      {...props}
    />
  )
}

const AlertDescription = ({ className, ...props }) => {
  return <div className={cn("text-sm leading-relaxed", className)} {...props} />
}

const AlertTitle = ({ className, ...props }) => {
  return <div className={cn("font-medium mb-1", className)} {...props} />
}

export { Alert, AlertDescription, AlertTitle }
