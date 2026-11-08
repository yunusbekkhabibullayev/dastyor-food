import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { orderStages } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => 0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function StatusBadge({ stage }: { stage: number }) {
  const done = stage >= orderStages.length - 1;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
        done ? "bg-success-soft text-success" : "bg-primary-soft text-primary",
      )}
    >
      {orderStages[stage]}
    </span>
  );
}

export function OrderTimeline({ stage }: { stage: number }) {
  return (
    <ol className="space-y-0" aria-label="Buyurtma holati">
      {orderStages.map((label, i) => {
        const done = i < stage || stage === orderStages.length - 1;
        const current = i === stage && !done;
        return (
          <li
            key={label}
            className="relative flex gap-3 pb-5 last:pb-0"
            aria-current={current ? "step" : undefined}
          >
            {i < orderStages.length - 1 && (
              <span
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-0.5",
                  i < stage ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative grid h-7 w-7 shrink-0 place-items-center rounded-full border-2",
                done && "border-primary bg-primary text-primary-foreground",
                current && "border-primary bg-background",
                !done && !current && "border-border bg-background",
              )}
            >
              {done ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : current ? (
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
              ) : null}
            </span>
            <div className="pt-0.5">
              <p className={cn("text-sm font-bold", !done && !current && "text-muted-foreground")}>
                {label}
              </p>
              {current && <p className="text-[11px] text-primary">Hozirgi bosqich</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
