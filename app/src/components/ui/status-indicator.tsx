import { cn } from "@/lib/utils"

export interface StatusIndicatorProps {
  status: "active" | "completed" | "pending" | "error" | "warning"
  label?: string
  size?: "sm" | "md" | "lg"
  animated?: boolean
  className?: string
}

export function StatusIndicator({ 
  status, 
  label, 
  size = "md", 
  animated = true,
  className 
}: StatusIndicatorProps) {
  const baseClasses = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold"
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm", 
    lg: "px-4 py-2 text-base"
  }
  
  const statusConfig = {
    active: {
      bg: "bg-gradient-to-r from-green-500 to-green-600",
      text: "text-white",
      dot: "bg-white",
      animation: animated ? "animate-pulse" : "",
      icon: "🟢"
    },
    completed: {
      bg: "bg-gradient-to-r from-blue-500 to-blue-600", 
      text: "text-white",
      dot: "bg-white/80",
      animation: "",
      icon: "✅"
    },
    pending: {
      bg: "bg-gradient-to-r from-yellow-400 to-yellow-500",
      text: "text-yellow-900",
      dot: "bg-yellow-900/60",
      animation: animated ? "animate-pulse" : "",
      icon: "⏳"
    },
    error: {
      bg: "bg-gradient-to-r from-red-500 to-red-600",
      text: "text-white", 
      dot: "bg-white",
      animation: animated ? "animate-bounce" : "",
      icon: "❌"
    },
    warning: {
      bg: "bg-gradient-to-r from-orange-500 to-orange-600",
      text: "text-white",
      dot: "bg-white/80", 
      animation: animated ? "animate-pulse" : "",
      icon: "⚠️"
    }
  }
  
  const config = statusConfig[status]
  
  return (
    <span className={cn(baseClasses, sizeClasses[size], config.bg, config.text, className)}>
      <span className={cn("w-2 h-2 rounded-full", config.dot, config.animation)}></span>
      <span className="flex items-center gap-1">
        <span>{config.icon}</span>
        {label && <span>{label}</span>}
      </span>
    </span>
  )
}

export interface ProgressRingProps {
  value: number
  max: number
  size?: "sm" | "md" | "lg" | "xl"
  strokeWidth?: number
  showValue?: boolean
  label?: string
  color?: "blue" | "green" | "orange" | "red" | "purple"
  className?: string
}

export function ProgressRing({
  value,
  max,
  size = "md",
  strokeWidth,
  showValue = true,
  label,
  color = "blue",
  className
}: ProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const sizes = {
    sm: { dimension: 40, defaultStroke: 3 },
    md: { dimension: 60, defaultStroke: 4 },
    lg: { dimension: 80, defaultStroke: 5 },
    xl: { dimension: 120, defaultStroke: 6 }
  }
  
  const { dimension, defaultStroke } = sizes[size]
  const stroke = strokeWidth || defaultStroke
  const radius = (dimension - stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference
  
  const colorConfig = {
    blue: { stroke: "stroke-blue-500", bg: "stroke-blue-100" },
    green: { stroke: "stroke-green-500", bg: "stroke-green-100" },
    orange: { stroke: "stroke-orange-500", bg: "stroke-orange-100" },
    red: { stroke: "stroke-red-500", bg: "stroke-red-100" },
    purple: { stroke: "stroke-purple-500", bg: "stroke-purple-100" }
  }
  
  const colors = colorConfig[color]
  
  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <div className="relative">
        <svg 
          width={dimension} 
          height={dimension} 
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className={colors.bg}
          />
          {/* Progress circle */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn(colors.stroke, "transition-all duration-500 ease-out")}
          />
        </svg>
        
        {/* Center content */}
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={cn("font-bold", {
                "text-lg": size === "xl",
                "text-base": size === "lg", 
                "text-sm": size === "md",
                "text-xs": size === "sm"
              })}>
                {Math.round(percentage)}%
              </div>
              {size === "xl" && (
                <div className="text-xs text-gray-500 mt-1">
                  {value}/{max}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {label && (
        <div className="mt-2 text-center">
          <div className="text-sm font-medium text-gray-900">{label}</div>
        </div>
      )}
    </div>
  )
}

export interface ActivityPulseProps {
  active?: boolean
  color?: "green" | "blue" | "orange" | "red"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ActivityPulse({ 
  active = true, 
  color = "green", 
  size = "md",
  className 
}: ActivityPulseProps) {
  const sizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4"
  }
  
  const colors = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500", 
    red: "bg-red-500"
  }
  
  return (
    <span className={cn("relative inline-flex", className)}>
      <span className={cn("inline-flex rounded-full", sizes[size], colors[color])}></span>
      {active && (
        <span className={cn(
          "absolute top-0 left-0 inline-flex rounded-full opacity-75 animate-ping", 
          sizes[size], 
          colors[color]
        )}></span>
      )}
    </span>
  )
}
