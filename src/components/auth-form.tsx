"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Keep redirects on our own site: accept "/path" or an absolute URL, use only its path. */
function toLocalPath(next: string | null): string {
  if (!next) return "/dashboard";
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  try {
    const u = new URL(next);
    return `${u.pathname}${u.search}` || "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const params = useSearchParams();
  const safeNext = toLocalPath(params.get("next") ?? params.get("callbackUrl"));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const timezone = browserTimeZone();

    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.get("name"), email, password, timezone }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Не удалось зарегистрироваться.");
        }
      }
      const res = await signIn("credentials", { email, password, timezone, redirect: false });
      if (!res || res.error) throw new Error("Неверный email или пароль.");
      window.location.href = safeNext;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="mb-2 text-center">
        <h1 className="text-4xl">{mode === "login" ? "С возвращением" : "Создать аккаунт"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login" ? "Войдите, чтобы продолжить занятия" : "10 минут практики каждый день — бесплатно"}
        </p>
      </div>
      {mode === "register" && (
        <div className="space-y-1.5">
          <Label htmlFor="name">Имя</Label>
          <Input id="name" name="name" required autoComplete="name" className="h-10" />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" className="h-10" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="h-10"
        />
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-11 w-full" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />}
        {mode === "login" ? "Войти" : "Зарегистрироваться"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Нет аккаунта?{" "}
            <Link href={`/register?next=${encodeURIComponent(safeNext)}`} className="text-primary underline-offset-2 hover:underline">
              Зарегистрируйтесь
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link href={`/login?next=${encodeURIComponent(safeNext)}`} className="text-primary underline-offset-2 hover:underline">
              Войти
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
