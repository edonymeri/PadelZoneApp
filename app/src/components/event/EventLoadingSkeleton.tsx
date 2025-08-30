// src/components/event/EventLoadingSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface EventLoadingSkeletonProps {
  courtCount: number;
}

export default function EventLoadingSkeleton({ courtCount }: EventLoadingSkeletonProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200 mb-4" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
          </div>

          {/* Controls skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-6 w-24 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                <div className="h-6 w-12 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </div>

          {/* Progress skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-2 w-full animate-pulse rounded bg-gray-200 mb-4" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: courtCount }).map((_, i) => (
                <div key={i} className="h-6 w-20 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          </div>

          {/* Courts skeleton */}
          <div className="grid gap-6">
            {Array.from({ length: courtCount }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-32 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>

          {/* Action bar skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-32 animate-pulse rounded bg-gray-100" />
              <div className="h-10 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-10 w-28 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
