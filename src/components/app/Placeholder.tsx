import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "./BottomNav";
import { Button } from "@/components/ui/button";

export function Placeholder({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: LucideIcon;
}) {
  return (
    <AppShell>
      <header className="pt-safe px-5 pb-3">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
      </header>
      <div className="flex flex-col items-center px-8 pt-20 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-primary-soft text-primary">
          <Icon className="h-9 w-9" />
        </div>
        <p className="mt-5 font-display text-lg font-semibold">Hozircha bo'sh</p>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        <Button asChild className="mt-6 h-12 rounded-2xl px-6 font-bold shadow-cta">
          <Link to="/home">Bosh sahifaga</Link>
        </Button>
      </div>
    </AppShell>
  );
}
