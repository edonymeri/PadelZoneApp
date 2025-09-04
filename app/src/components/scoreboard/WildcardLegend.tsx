import React from 'react';

interface WildcardLegendProps {
  upcomingRound: number | null;
  isWildcardNow: boolean;
}

export const WildcardLegend: React.FC<WildcardLegendProps> = ({ upcomingRound, isWildcardNow }) => {
  if (!isWildcardNow && !upcomingRound) return null;
  return (
    <div className="flex items-center gap-3 text-xs text-purple-700 bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg">
      <span>🎲</span>
      {isWildcardNow ? (
        <span className="font-medium">Wildcard round in progress</span>
      ) : (
        <span>Wildcard round coming up: <strong>Round {upcomingRound}</strong></span>
      )}
    </div>
  );
};
