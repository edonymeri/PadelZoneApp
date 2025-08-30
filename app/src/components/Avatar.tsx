// src/components/Avatar.tsx
import * as React from "react";

/** Deterministic, muted color from a string (name). */
function colorFromName(name?: string) {
  const s = (name || "?").toLowerCase();
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  // Map hash → hue 0..360 with a narrow saturation/lightness for subtlety
  const hue = Math.abs(hash) % 360;
  const saturation = 40; // muted
  const lightness = 40;  // medium-dark (works on dark UI)
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export default function Avatar({
  name,
  size = 22,
  className = "",
  title,
}: {
  name?: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  const bg = colorFromName(name);
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "9999px",
    fontSize: Math.max(9, Math.floor(size * 0.45)),
    lineHeight: `${size}px`,
    background: bg,
  };

  return (
    <div
      className={[
        "inline-flex items-center justify-center text-white font-semibold shadow-sm ring-1 ring-white/10",
        className,
      ].join(" ")}
      style={style}
      title={title ?? name}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
