import Link from "next/link";
import { LogOut, Sparkles, User } from "lucide-react";
import { getCurrentUser } from "@/lib/account";
import { isPro } from "@/lib/plans";
import { signOutAction } from "@/app/actions";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const APP_NAV = [
  { href: "/dashboard", label: "Обзор" },
  { href: "/learn", label: "Уроки" },
  { href: "/practice", label: "Практика" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const pro = isPro(user);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Logo href={user ? "/dashboard" : "/"} />
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {(user ? APP_NAV : [{ href: "/#stages", label: "Программа" }, { href: "/#how", label: "Как это работает" }]).map((i) => (
            <Button key={i.href} variant="ghost" asChild>
              <Link href={i.href}>{i.label}</Link>
            </Button>
          ))}
          <Button variant="ghost" asChild>
            <Link href="/pricing">Тарифы</Link>
          </Button>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {pro ? (
                <Badge className="bg-[var(--brick)] text-white">Pro</Badge>
              ) : (
                <Button asChild size="sm" className="hidden bg-[var(--brick)] text-white hover:bg-[var(--brick)]/90 sm:inline-flex">
                  <Link href="/pricing">
                    <Sparkles /> Pro
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Меню аккаунта">
                  <Avatar>
                    <AvatarFallback className="bg-[var(--sea)] text-[var(--ink)]">
                      {(user.name ?? user.email).slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user.name ?? user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {APP_NAV.map((i) => (
                    <DropdownMenuItem key={i.href} asChild className="md:hidden">
                      <Link href={i.href}>{i.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem asChild>
                    <Link href="/account">
                      <User /> Аккаунт и подписка
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={signOutAction}>
                    <DropdownMenuItem asChild>
                      <button type="submit" className="w-full">
                        <LogOut /> Выйти
                      </button>
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Начать бесплатно</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-[var(--ink)] text-[var(--mist)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="font-heading text-2xl">MathMentor</span>
        <span className="opacity-70">Персональный AI-репетитор по математике · © {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
