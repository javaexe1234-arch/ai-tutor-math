import type { Metadata } from "next";
import { IBM_Plex_Serif, Marck_Script } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { UpgradeDialogHost } from "@/components/upgrade-dialog";

const heading = Marck_Script({
  variable: "--font-heading-family",
  subsets: ["latin", "cyrillic"],
  weight: "400",
});

const body = IBM_Plex_Serif({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "MathMentor — AI-репетитор по математике", template: "%s · MathMentor" },
  description:
    "Персональный AI-репетитор по математике: уроки от таблицы умножения до производных, квизы, задачи, проверка решений и разбор ошибок.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${heading.variable} ${body.variable} min-h-dvh antialiased`}>
        {children}
        <UpgradeDialogHost />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
