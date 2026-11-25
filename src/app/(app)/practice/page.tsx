import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PracticeWorkspace } from "@/components/practice-workspace";
import { TutorChat } from "@/components/tutor-chat";
import { UsageMeter } from "@/components/usage-meter";
import { getCurrentUser, getUsageState } from "@/lib/account";
import { isPro } from "@/lib/plans";

export const metadata: Metadata = { title: "Практика" };

export default async function PracticePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const pro = isPro(user);
  const usage = await getUsageState(user);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-6">
        <div>
          <h1 className="text-5xl">Практика</h1>
          <p className="mt-1 text-muted-foreground">Выберите тему — репетитор подберёт задачи и квиз.</p>
        </div>
        <PracticeWorkspace pro={pro} />
      </div>
      <aside className="space-y-3 lg:sticky lg:top-20 lg:h-[calc(100dvh-6rem)] lg:self-start">
        <UsageMeter initial={usage} track />
        <TutorChat
          className="h-[520px] lg:h-[calc(100%-5.5rem)]"
          greeting="Привет! Я ваш репетитор. Пришлите задачу, которая не получается, или спросите про любую тему."
          suggestions={["Как делить столбиком?", "Дай 3 задачи на умножение", "Почему на ноль делить нельзя?"]}
        />
      </aside>
    </div>
  );
}
