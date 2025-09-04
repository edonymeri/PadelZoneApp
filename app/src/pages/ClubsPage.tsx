// src/pages/ClubsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

type Club = { id: string; name: string; created_at: string };

const BRAND = { primary: "#0172FB", secondary: "#01CBFC" };

export default function ClubsPage() {
  const { toast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Active club persisted in localStorage
  const [clubId, setClubId] = useState<string>(localStorage.getItem("clubId") || "");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clubs")
      .select("id,name,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Failed to load clubs", description: error.message });
      setClubs([]);
    } else {
      setClubs(data || []);
    }
    setLoading(false);
  }

  async function createClub() {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Club name is required" });
      return;
    }
    const { data, error } = await supabase.from("clubs").insert({ name: name.trim() }).select().single();
    if (error || !data) {
      toast({ variant: "destructive", title: "Create failed", description: error?.message || "Unknown error" });
      return;
    }
    // Persist and select the new club
    localStorage.setItem("clubId", data.id);
    setClubId(data.id);
    setName("");
    toast({ title: "Club created", description: data.name });
    await load();
  }

  function chooseClub(c: Club) {
    localStorage.setItem("clubId", c.id);
    setClubId(c.id);
    toast({ title: "Club selected", description: c.name });
    navigate("/events"); // SPA navigation
  }

  function selectClub(c: Club) {
    localStorage.setItem("clubId", c.id);
    setClubId(c.id);
    toast({ title: "Club selected", description: c.name });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Clubs</h1>
        <p className="text-sm text-muted-foreground">
          Create a club or pick an existing one to manage players and events.
        </p>
      </header>

      {/* Create club */}
      <Card className="border-border/70">
        <CardContent className="p-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            placeholder="Club name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            onClick={createClub}
            className="font-semibold"
            style={{
              background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.secondary})`,
              color: "#0B1220",
            }}
          >
            Create club
          </Button>
        </CardContent>
      </Card>

      {/* List clubs */}
      {loading ? (
        <div className="rounded-xl border border-border/60 p-6 text-center text-muted-foreground">
          Loading…
        </div>
      ) : clubs.length === 0 ? (
        <div className="rounded-xl border border-border/60 p-6 text-center text-muted-foreground">
          No clubs yet. Create your first club above.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clubs.map((c) => {
            const isSelected = c.id === clubId;
            return (
              <div
                key={c.id}
                className={`flex items-center justify-between rounded-xl border p-3 transition
                  ${
                    isSelected
                      ? "border-[#0172FB] bg-[#0172FB]/5"
                      : "border-border hover:bg-muted/40"
                  }`}
              >
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  {isSelected ? (
                    <Button size="sm" variant="secondary" disabled>
                      Selected
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => selectClub(c)}>
                      Select
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
