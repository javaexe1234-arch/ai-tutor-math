"use client";

import { useState } from "react";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ManageSubscriptionButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="lg"
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch("/api/stripe/portal", { method: "POST" });
          const data = await res.json();
          if (!res.ok || !data.url) throw new Error(data.error ?? "Не удалось открыть управление подпиской.");
          window.location.href = data.url;
        } catch (e) {
          toast.error((e as Error).message);
          setBusy(false);
        }
      }}
    >
      {busy ? <Loader2 className="animate-spin" /> : <Settings />} Управлять подпиской
    </Button>
  );
}
