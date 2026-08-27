"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function ReportButton({ ideaId }: { ideaId: string }) {
  const [state, setState] = useState<"idle" | "confirming" | "reporting" | "done">("idle");

  const report = async () => {
    if (state === "done") return;
    setState("reporting");
    const supabase = createClient();
    const { data: hidden, error } = await supabase.rpc("report_idea", {
      target_id: ideaId,
    } as never);
    if (error) {
      if (error.code === "PGRST116" || (error.message && error.message.includes("function report_idea"))) {
        // Function not deployed yet — degrade gracefully.
        setState("idle");
        return;
      }
      setState("idle");
      return;
    }
    setState("done");
    if (hidden === true) {
      window.dispatchEvent(new Event("idea-hidden"));
    }
  };

  if (state === "done") {
    return (
      <span className="text-xs text-muted-foreground">
        Thanks — reported for review.
      </span>
    );
  }

  if (state === "confirming") {
    return (
      <span className="flex items-center gap-2">
        <button onClick={report} className="text-xs text-red-400 hover:text-red-300 font-medium">
          Confirm report
        </button>
        <button onClick={() => setState("idle")} className="text-xs text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setState("confirming")}
      disabled={state === "reporting"}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
      aria-label="Report this idea"
    >
      <Flag className="w-3.5 h-3.5" />
      {state === "reporting" ? "Reporting…" : "Report"}
    </button>
  );
}
