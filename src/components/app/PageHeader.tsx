import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function PageHeader({
  title,
  back,
  right,
}: {
  title: string;
  back: "/home" | "/cart" | "/restaurants" | "/profile";
  right?: React.ReactNode;
}) {
  return (
    <header className="pt-safe sticky top-0 z-30 grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 bg-background/95 px-5 pb-3 backdrop-blur">
      <Link
        to={back}
        aria-label="Orqaga"
        className="grid h-10 w-10 place-items-center rounded-full border border-border"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="truncate text-center font-display text-lg font-bold">{title}</h1>
      <div className="flex min-w-10 justify-end">{right}</div>
    </header>
  );
}

export function DemoNotice() {
  return null;
}
