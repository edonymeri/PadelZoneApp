import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("modern-skeleton h-4 w-full", className)}
      {...props}
    />
  )
}

// Specialized skeleton components for common use cases
function EventCardSkeleton() {
  return (
    <div className="modern-card animate-pulse">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div>
                  <Skeleton className="h-5 w-12 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <Skeleton className="h-8 w-24 rounded-full" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-32 rounded-2xl" />
            <Skeleton className="h-12 w-28 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PlayerCardSkeleton() {
  return (
    <div className="modern-card animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div className="flex-1">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CourtCardSkeleton() {
  return (
    <div className="modern-card animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div>
            <Skeleton className="h-6 w-24 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-32 rounded-2xl" />
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="w-16 h-12 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Loading states with animations
function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };
  
  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-500`}></div>
  );
}

function LoadingPulse({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-pulse opacity-70">
      {children}
    </div>
  );
}

// Empty state component
function EmptyState({ 
  icon = "📭", 
  title, 
  description, 
  action 
}: { 
  icon?: string; 
  title: string; 
  description: string; 
  action?: React.ReactNode; 
}) {
  return (
    <div className="text-center py-16 modern-fade-in">
      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="modern-heading-3 text-gray-900 mb-2">{title}</h3>
      <p className="modern-text-body text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export { 
  Skeleton, 
  EventCardSkeleton, 
  PlayerCardSkeleton, 
  CourtCardSkeleton,
  LoadingSpinner,
  LoadingPulse,
  EmptyState
}