// ui/tabs.jsx
import { useState, createContext, useContext } from "react"

const TabsContext = createContext()

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className = "" }) {
  const [internalValue, setInternalValue] = useState(defaultValue || "")
  const value = controlledValue !== undefined ? controlledValue : internalValue
  
  const setValue = (newValue) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    if (onValueChange) {
      onValueChange(newValue)
    }
  }

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={`tabs ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = "" }) {
  return (
    <div className={`tabs-list ${className}`}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className = "" }) {
  const { value: selectedValue, setValue } = useContext(TabsContext)
  const isActive = selectedValue === value

  return (
    <button
      className={`tabs-trigger ${isActive ? 'active' : ''} ${className}`}
      onClick={() => setValue(value)}
      type="button"
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className = "" }) {
  const { value: selectedValue } = useContext(TabsContext)
  
  if (selectedValue !== value) {
    return null
  }

  return (
    <div className={`tabs-content ${className}`}>
      {children}
    </div>
  )
}