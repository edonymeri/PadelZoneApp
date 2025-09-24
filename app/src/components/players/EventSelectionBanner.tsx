// src/components/players/EventSelectionBanner.tsx
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EventMeta {
  name: string;
  courts: number;
}

interface EventSelectionBannerProps {
  eventMeta: EventMeta;
  selectedCount: number;
  neededCount: number;
}

export default function EventSelectionBanner({ 
  eventMeta, 
  selectedCount, 
  neededCount 
}: EventSelectionBannerProps) {
  return (
    <Card className="border-2 shadow-lg" style={{ borderColor: '#0172fb', backgroundColor: '#f8faff' }}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0172fb' }}>
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{eventMeta.name}</h3>
              <p className="text-gray-700 text-sm">
                Select players for this event • {eventMeta.courts} courts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#0172fb' }}>{selectedCount}</div>
              <div className="text-sm text-gray-600">Selected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{neededCount}</div>
              <div className="text-sm text-gray-600">Needed</div>
            </div>
            <div className="text-center">
              <div 
                className={`text-2xl font-bold ${
                  selectedCount >= neededCount ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {selectedCount >= neededCount ? '✓' : Math.max(0, neededCount - selectedCount)}
              </div>
              <div className="text-sm text-gray-600">
                {selectedCount >= neededCount ? 'Ready' : 'Still Need'}
              </div>
            </div>
          </div>
        </div>
        
        {selectedCount < neededCount && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> You need at least {neededCount} players to fill all courts. 
              Select {neededCount - selectedCount} more player{neededCount - selectedCount !== 1 ? 's' : ''} to continue.
            </p>
          </div>
        )}
        
        {selectedCount > neededCount && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Great!</strong> You have {selectedCount - neededCount} extra player{selectedCount - neededCount !== 1 ? 's' : ''} selected. 
              This allows for substitutions during the event.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}