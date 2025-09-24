// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Toaster } from "@/components/ui/toaster";

import { AuthGate } from "./auth/AuthGate";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import SettingsRefactored from "./pages/SettingsRefactored";
import ClubsPage from "./pages/ClubsPage";
import PlayersPageRefactored from "./pages/PlayersPageRefactored";
import EventsPage from "./pages/EventsPage";
import EventControlPageRefactored from "./pages/EventControlPageRefactored";
import ScoreboardRefactored from "./pages/ScoreboardRefactored";
import PlayerProfile from "./pages/PlayerProfile";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthGate>
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<SettingsRefactored />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/players" element={<PlayersPageRefactored />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/event/:eventId" element={<EventControlPageRefactored />} />
              <Route path="/scoreboard" element={<ScoreboardRefactored />} />
              <Route path="/scoreboard/:eventId" element={<ScoreboardRefactored />} />
              <Route path="/player/:playerId" element={<PlayerProfile />} />

            </Routes>
          </AppShell>
        </AuthGate>
      </BrowserRouter>
      <Toaster />
    </ErrorBoundary>
  );
}
