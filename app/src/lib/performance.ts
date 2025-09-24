// Performance monitoring utilities for tournament operations

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface TournamentMetrics {
  roundGeneration: PerformanceMetric[];
  scoreCalculation: PerformanceMetric[];
  databaseOperations: PerformanceMetric[];
  userInteractions: PerformanceMetric[];
}

class PerformanceMonitor {
  private metrics: TournamentMetrics = {
    roundGeneration: [],
    scoreCalculation: [],
    databaseOperations: [],
    userInteractions: [],
  };

  private activeTimers: Map<string, number> = new Map();

  // Start timing an operation
  startTimer(name: string, category: keyof TournamentMetrics = 'userInteractions'): void {
    const timerId = `${category}-${name}-${Date.now()}`;
    this.activeTimers.set(timerId, performance.now());
  }

  // End timing and record metric
  endTimer(name: string, category: keyof TournamentMetrics = 'userInteractions', metadata?: Record<string, any>): number {
    const timerId = `${category}-${name}-${Date.now()}`;
    const startTime = this.activeTimers.get(timerId);
    
    if (!startTime) {
      console.warn(`No active timer found for ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.activeTimers.delete(timerId);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics[category].push(metric);
    
    // Keep only last 100 metrics per category to prevent memory issues
    if (this.metrics[category].length > 100) {
      this.metrics[category] = this.metrics[category].slice(-100);
    }

    return duration;
  }

  // Time a function execution
  async timeFunction<T>(
    fn: () => Promise<T> | T,
    name: string,
    category: keyof TournamentMetrics = 'userInteractions',
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, success: true },
      };
      
      this.metrics[category].push(metric);
      
      // Log slow operations (>1s for round generation, >500ms for others)
      const slowThreshold = category === 'roundGeneration' ? 1000 : 500;
      if (duration > slowThreshold) {
        console.warn(`Slow ${category} operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp: Date.now(),
        metadata: { 
          ...metadata, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        },
      };
      
      this.metrics[category].push(metric);
      throw error;
    }
  }

  // Get performance statistics
  getStats(category?: keyof TournamentMetrics) {
    const categories = category ? [category] : Object.keys(this.metrics) as (keyof TournamentMetrics)[];
    
    return categories.reduce((stats, cat) => {
      const metrics = this.metrics[cat];
      if (metrics.length === 0) {
        stats[cat] = { count: 0, avgDuration: 0, maxDuration: 0, minDuration: 0 };
        return stats;
      }

      const durations = metrics.map(m => m.duration);
      const successfulMetrics = metrics.filter(m => m.metadata?.success !== false);
      
      stats[cat] = {
        count: metrics.length,
        successCount: successfulMetrics.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
        p95Duration: this.calculatePercentile(durations, 95),
        recentOperations: metrics.slice(-10).map(m => ({
          name: m.name,
          duration: m.duration,
          timestamp: new Date(m.timestamp).toISOString(),
          success: m.metadata?.success !== false,
        })),
      };
      
      return stats;
    }, {} as Record<keyof TournamentMetrics, any>);
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = {
      roundGeneration: [],
      scoreCalculation: [],
      databaseOperations: [],
      userInteractions: [],
    };
    this.activeTimers.clear();
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      stats: this.getStats(),
    }, null, 2);
  }

  // Log performance summary
  logPerformanceSummary(): void {
    const stats = this.getStats();
    
    console.group('🚀 Tournament Performance Summary');
    
    Object.entries(stats).forEach(([category, data]) => {
      if (data.count > 0) {
        console.log(`${category}:`, {
          operations: data.count,
          successRate: `${((data.successCount / data.count) * 100).toFixed(1)}%`,
          avgTime: `${data.avgDuration.toFixed(2)}ms`,
          maxTime: `${data.maxDuration.toFixed(2)}ms`,
          p95Time: `${data.p95Duration.toFixed(2)}ms`,
        });
      }
    });
    
    console.groupEnd();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance monitoring decorators/helpers for common operations
export const monitorRoundGeneration = <T extends any[], R>(
  fn: (...args: T) => R,
  name: string = 'roundGeneration'
) => {
  return (...args: T): R => {
    return performanceMonitor.timeFunction(
      () => fn(...args),
      name,
      'roundGeneration',
      { playerCount: args[0]?.courts?.length * 4 }
    ) as R;
  };
};

export const monitorDatabaseOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  tableName?: string
): Promise<T> => {
  return performanceMonitor.timeFunction(
    operation,
    operationName,
    'databaseOperations',
    { table: tableName }
  );
};

// React hook for performance monitoring in components
export const usePerformanceMonitor = () => {
  const startTimer = (name: string, category?: keyof TournamentMetrics) => {
    performanceMonitor.startTimer(name, category);
  };

  const endTimer = (name: string, category?: keyof TournamentMetrics, metadata?: Record<string, any>) => {
    return performanceMonitor.endTimer(name, category, metadata);
  };

  const timeFunction = async <T>(
    fn: () => Promise<T> | T,
    name: string,
    category?: keyof TournamentMetrics,
    metadata?: Record<string, any>
  ): Promise<T> => {
    return performanceMonitor.timeFunction(fn, name, category, metadata);
  };

  const getStats = (category?: keyof TournamentMetrics) => {
    return performanceMonitor.getStats(category);
  };

  const logSummary = () => {
    performanceMonitor.logPerformanceSummary();
  };

  return {
    startTimer,
    endTimer,
    timeFunction,
    getStats,
    logSummary,
    monitor: performanceMonitor,
  };
};