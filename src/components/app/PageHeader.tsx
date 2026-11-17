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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3 relative min-h-[56px] max-w-xl mx-auto">
        {/* Back button */}
        <Link
          to={back}
          aria-label="Orqaga"
          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors bg-white shadow-xs z-10 active:scale-95"
        >
          <ChevronLeft className="w-[18px] h-[18px] stroke-[2.2]" />
        </Link>

        {/* Centered Page Title */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
          <span className="text-[17px] font-extrabold text-gray-900 tracking-tight truncate">
            {title}
          </span>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-2 z-10 min-w-8 justify-end">
          {right}
        </div>
      </div>
    </header>
  );
}

export function DemoNotice() {
  return null;
}
