import React from "react";

/** Deterministic color from a string (player name) */
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;            // 0–359
  return `hsl(${hue}, 70%, 45%)`;               // lively but not neon
}

/** First + last initials (or first only) */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0][0] ?? "?").toUpperCase();
  return `${(parts[0][0] ?? "").toUpperCase()}${(parts[1][0] ?? "").toUpperCase()}`;
}

export default function PlayerAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const bg = stringToColor(name);
  const label = initials(name);

  return (
    <div
      aria-hidden
      className="flex items-center justify-center rounded-full font-bold text-white select-none"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: Math.max(10, Math.round(size * 0.38)) }}
      title={name}
    >
      {label}
    </div>
  );
}
