import { CircleDot, CheckCircle2 } from "lucide-react";

export default function StatusChip({ ended_at }: { ended_at: string | null | undefined }) {
  if (ended_at) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground border-border/60">
        <CheckCircle2 size={14} className="text-emerald-400" />
        Completed
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
      style={{ color: "#0172FB", borderColor: "rgba(1,114,251,0.35)" }}
    >
      <CircleDot size={14} />
      Ongoing
    </span>
  );
}
