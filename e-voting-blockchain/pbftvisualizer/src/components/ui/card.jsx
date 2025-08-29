const Card = ({ className, ...props }) => <div className={`card ${className || ""}`} {...props} />

const CardHeader = ({ className, ...props }) => <div className={`card-header ${className || ""}`} {...props} />

const CardTitle = ({ className, ...props }) => <h3 className={`card-title ${className || ""}`} {...props} />

const CardContent = ({ className, ...props }) => <div className={`card-content ${className || ""}`} {...props} />

export { Card, CardHeader, CardTitle, CardContent }
