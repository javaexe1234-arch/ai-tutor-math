import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)} aria-label="MathMentor — на главную">
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--pine)] text-lg font-semibold text-[var(--mist)]">
        π
      </span>
      <span className="font-heading text-3xl leading-none text-foreground">MathMentor</span>
    </Link>
  );
}
