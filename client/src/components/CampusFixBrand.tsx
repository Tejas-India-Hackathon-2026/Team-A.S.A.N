import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function CampusFixBrand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#072a63] text-[#ffd53d] shadow-[0_10px_24px_rgba(7,42,99,0.22)]">
        <Zap className="h-5 w-5 fill-current" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className="block text-lg font-extrabold tracking-[-0.05em] text-[#071b42]">CampusFix</span>
          <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.19em] text-[#365684]">Report · Track · Resolve</span>
        </span>
      )}
    </div>
  );
}
