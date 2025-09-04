import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function BackButton({
  fallback = "/events",
  hideOn = ["/", "/events"],
  label = "Back",
}: {
  /** Route to go to if history stack is shallow */
  fallback?: string;
  /** Paths where the back button should be hidden */
  hideOn?: string[];
  /** Accessible label */
  label?: string;
}) {
  const nav = useNavigate();
  const { pathname } = useLocation();

  if (hideOn.some((p) => pathname === p || pathname.startsWith(p + "/") && p === "/")) {
    // hide on the home page, and on /events list by default
    if (pathname === "/" || pathname === "/events") return null;
  }

  const goBack = () => {
    // If we have browser history, go back; otherwise go to a safe fallback
    if (window.history.length > 2) nav(-1);
    else nav(fallback);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={goBack}
      className="gap-2 text-foreground/80 hover:text-foreground"
      aria-label={label}
    >
      <ArrowLeft size={16} />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
