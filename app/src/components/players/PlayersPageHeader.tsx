// src/components/players/PlayersPageHeader.tsx
import { Link } from "react-router-dom";
import { Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventMeta {
  name: string;
  courts: number;
}

interface PlayersPageHeaderProps {
  eventId?: string | null;
  eventMeta?: EventMeta | null;
  playersCount: number;
  neededPlayers?: number;
}

export default function PlayersPageHeader({ 
  eventId, 
  eventMeta, 
  playersCount, 
  neededPlayers 
}: PlayersPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {eventId && (
          <Button variant="outline" size="sm" asChild className="border-gray-300">
            <Link to={`/event/${eventId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Event
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            {eventId && eventMeta ? `${eventMeta.name} Players` : "Club Players"}
          </h1>
          <p className="text-gray-600 mt-1">
            {eventId && eventMeta 
              ? `Managing players for this event • ${eventMeta.courts} courts • Need ${neededPlayers} players`
              : `Manage your club's player roster and statistics • ${playersCount} total players`
            }
          </p>
        </div>
      </div>
    </div>
  );
}