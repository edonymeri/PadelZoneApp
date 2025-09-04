// src/components/ui/switch.tsx
import * as React from "react"
import * as SwitchPr from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPr.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPr.Root>
>(({ className, ...props }, ref) => (
  <SwitchPr.Root
    ref={ref}
    className={cn(
      // Track
      "peer relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-in-out",
      "border-white/80",
      "data-[state=unchecked]:bg-transparent",
      "data-[state=checked]:bg-[#0172FB]", // brand primary
      // Focus ring
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0172FB]",
      className
    )}
    {...props}
  >
    <SwitchPr.Thumb
      className={cn(
        // Thumb
        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform",
        // Positions
        "data-[state=unchecked]:translate-x-0.5",
        "data-[state=checked]:translate-x-[1.375rem]"
      )}
    />
  </SwitchPr.Root>
))
Switch.displayName = "Switch"

export { Switch }
