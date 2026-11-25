import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="math-grid flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-sm rounded-3xl border bg-card p-7 shadow-xl shadow-[var(--pine)]/10">{children}</div>
    </div>
  );
}
