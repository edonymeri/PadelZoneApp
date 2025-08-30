// src/components/CourtCard.tsx
import { motion } from "framer-motion";

function ScoreValue({ value }: { value: number }) {
  // Re-mount on value change for a quick scale+fade micro-interaction
  return (
    <motion.span
      key={value}
      initial={{ scale: 0.9, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {value}
    </motion.span>
  );
}

export default function CourtCard({
  courtNum,
  isWinners,
  teamALabel,
  teamBLabel,
  scoreA,
  scoreB,
  children,
}: {
  courtNum: number;
  isWinners?: boolean;
  teamALabel: React.ReactNode;   // changed to ReactNode (so we can pass avatars)
  teamBLabel: React.ReactNode;   // changed to ReactNode (so we can pass avatars)
  scoreA?: number;
  scoreB?: number;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-4 ${
        isWinners ? "ring-1 ring-brand-500/30 bg-court-winners" : "bg-court-base"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-display text-lg flex items-center gap-2">
          Court {courtNum}
          {isWinners && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-500 border border-brand-500/20">
              Winners
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 items-center gap-3">
        <div className="truncate flex items-center gap-2">{teamALabel}</div>
        <div className="text-center text-muted-foreground">vs</div>
        <div className="truncate text-right flex items-center justify-end gap-2">
          {teamBLabel}
        </div>
      </div>

      {scoreA != null && scoreB != null && (
        <div className="mt-3 text-center font-display text-4xl">
          <ScoreValue value={scoreA} />{" "}
          <span className="text-muted-foreground">:</span>{" "}
          <ScoreValue value={scoreB} />
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}
    </motion.div>
  );
}
