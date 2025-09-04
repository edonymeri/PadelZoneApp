// src/components/ScorePad.tsx
import * as React from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  label: string;          // e.g. "Court 1 — Ana & Marko"
  initial?: number;
  /** If provided, points mode: show winner values + draw (if even). */
  total?: number;
  onSubmit: (val: number) => void;
};

export default function ScorePad({ open, onOpenChange, label, initial = 0, total, onSubmit }: Props) {
  const [val, setVal] = React.useState<number>(initial);
  React.useEffect(() => { setVal(initial); }, [initial, open]);

  const isPointsMode = typeof total === "number" && total > 0;

  // winner values + draw (if even): ceil(total/2) .. total
  const choices = React.useMemo<number[]>(() => {
    if (!isPointsMode) return [];
    const start = Math.ceil(total! / 2);
    const out: number[] = [];
    for (let n = start; n <= (total as number); n++) out.push(n);
    return out;
  }, [isPointsMode, total]);

  // simple 0..30 for time mode
  const fallback = React.useMemo<number[]>(() => {
    const out: number[] = [];
    for (let n = 0; n <= 30; n++) out.push(n);
    return out;
  }, []);

  const grid = isPointsMode ? choices : fallback;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[95vw] md:w-auto p-6 md:p-4">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-xl text-center md:text-left font-bold mb-4 md:mb-2">{label}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-5 md:grid-cols-5 gap-3 md:gap-2 py-6 md:py-2">
          {grid.map((n) => (
            <Button
              key={n}
              variant={val === n ? "default" : "outline"}
              onClick={() => setVal(n)}
              className="h-14 md:h-9 text-lg md:text-sm font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
            >
              {n}
            </Button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-2 pt-6 md:pt-2">
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            className="h-14 md:h-9 text-lg md:text-sm order-2 md:order-1 font-semibold shadow-lg hover:shadow-xl active:scale-95"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSubmit(val);
              onOpenChange(false);
            }}
            className="h-14 md:h-9 text-lg md:text-sm order-1 md:order-2 font-semibold shadow-lg hover:shadow-xl active:scale-95"
          >
            Save Score
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
