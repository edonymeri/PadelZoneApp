// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Toaster } from "@/components/ui/toaster";

import { AuthGate } from "./auth/AuthGate";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ClubsPage from "./pages/ClubsPage";
import PlayersPage from "./pages/PlayersPage";
import EventsPage from "./pages/EventsPage";
import EventControlPageRefactored from "./pages/EventControlPageRefactored";
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
              <Route path="/settings" element={<Settings />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/players" element={<PlayersPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/event/:eventId" element={<EventControlPageRefactored />} />
              <Route path="/player/:playerId" element={<PlayerProfile />} />

            </Routes>
          </AppShell>
        </AuthGate>
      </BrowserRouter>
      <Toaster />
    </ErrorBoundary>
  );
}
