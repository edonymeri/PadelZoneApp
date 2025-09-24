// src/components/nightly/MiniAvatar.tsx

/* ---------- Shared mini avatar (deterministic, non-blue palette) ---------- */
function colorForName(name?: string) {
  const palette = ["#F59E0B","#10B981","#EF4444","#8B5CF6","#F97316","#14B8A6","#A855F7","#EAB308","#22C55E","#EC4899"];
  if (!name) return palette[0];
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function initials(name?: string) {
  if (!name) return "–";
  const parts = name.trim().split(/\s+/);
  const i1 = parts[0]?.[0] ?? "";
  const i2 = parts[1]?.[0] ?? "";
  const s = (i1 + i2).toUpperCase();
  return s || i1.toUpperCase() || "–";
}

export function MiniAvatar({ name, size = 24 }: { name?: string; size?: number }) {
  const bg = colorForName(name);
  return (
    <div
      className="rounded-full grid place-content-center font-semibold"
      style={{ width: size, height: size, background: bg, color: "white", fontSize: Math.max(10, Math.floor(size*0.42)) }}
      title={name || ""}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}