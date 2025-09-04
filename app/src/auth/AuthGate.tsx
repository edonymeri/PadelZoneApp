import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!session) return <SignIn />;

  return <>{children}</>;
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState<"in"|"up">("in");
  const [msg, setMsg] = useState<string | null>(null);

  async function handle() {
    setMsg(null);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) throw error;
        setMsg("Check your email to confirm (if confirmations are on). Then Sign In.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      }
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", padding: 16, border: "1px solid #333", borderRadius: 12 }}>
      <h2>Padel Mexicano — Sign {mode === "up" ? "Up" : "In"}</h2>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} style={{ width: "100%", margin: "6px 0" }}/>
      <input type="password" placeholder="password" value={pw} onChange={e=>setPw(e.target.value)} style={{ width: "100%", margin: "6px 0" }}/>
      <button onClick={handle} style={{ width: "100%", marginTop: 8 }}>Continue</button>
      <div style={{ marginTop: 8 }}>
        <button onClick={()=>setMode(mode==="in"?"up":"in")} style={{ width: "100%" }}>
          {mode==="in" ? "Create an account" : "Have an account? Sign in"}
        </button>
      </div>
      {msg && <p style={{ color: "tomato" }}>{msg}</p>}
    </div>
  );
}
