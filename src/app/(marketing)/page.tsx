import Link from "next/link";
import { ArrowRight, Brain, CheckCheck, Clock, MessageCircleQuestion, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingTable } from "@/components/pricing-table";
import { getCurrentUser } from "@/lib/account";
import { isPro } from "@/lib/plans";
import { STAGES } from "@/lib/curriculum";

const STEPS = [
  { icon: Target, title: "Выберите этап", text: "От таблицы умножения до производных — 15 уровней в трёх этапах." },
  { icon: MessageCircleQuestion, title: "Занимайтесь с репетитором", text: "AI задаёт наводящие вопросы и подсказывает, а не выдаёт готовый ответ." },
  { icon: CheckCheck, title: "Закрепляйте", text: "Квизы и задачи с мгновенной проверкой после каждого урока." },
  { icon: Brain, title: "Разбирайте ошибки", text: "В Pro репетитор найдёт ошибку в вашем решении и объяснит, как правильно." },
];

const FAQ = [
  { q: "Для кого MathMentor?", a: "Для школьников, студентов и взрослых, которые хотят подтянуть математику — от базовой арифметики до начал анализа." },
  { q: "Как работает лимит Free?", a: "Каждый день у вас 10 минут практики с репетитором. Минуты обновляются в 12:00 по вашему местному времени." },
  { q: "Что даёт Pro?", a: "Неограниченное время, все этапы и уровни, AI-проверку решений с пошаговым разбором ошибок." },
  { q: "Можно отменить подписку?", a: "Да, в любой момент в разделе «Аккаунт». Доступ к Pro сохранится до конца оплаченного периода." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <>
      {/* Hero */}
      <section className="math-grid relative overflow-hidden border-b">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.15fr_1fr] md:py-24">
          <div>
            <Badge variant="outline" className="mb-5 border-[var(--sea)] bg-card">
              Персональный AI-репетитор
            </Badge>
            <h1 className="text-5xl leading-[1.05] text-[var(--ink)] sm:text-7xl dark:text-[var(--mist)]">
              Математика, которая наконец-то понятна
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              MathMentor объясняет каждую тему простыми словами, подбирает задачи под ваш уровень и терпеливо разбирает
              ошибки — как личный репетитор, только доступен в любое время.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-5 text-base">
                <Link href={user ? "/dashboard" : "/register"}>
                  {user ? "Продолжить занятия" : "Начать бесплатно"} <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-5 text-base">
                <Link href="#stages">Смотреть программу</Link>
              </Button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" /> 10 минут бесплатно каждый день · без карты
            </p>
          </div>

          {/* Mock chat */}
          <div className="rounded-3xl border bg-card p-5 shadow-xl shadow-[var(--pine)]/10">
            <div className="space-y-3 text-sm">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--pine)] px-4 py-2 text-[var(--mist)]">
                Не понимаю, почему 3x − 4 = 11 даёт x = 5
              </div>
              <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2">
                Давайте по шагам. Что нужно сделать, чтобы слева осталось только <b>3x</b>? Подумайте, что произойдёт, если
                прибавить 4 к обеим частям.
              </div>
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--pine)] px-4 py-2 text-[var(--mist)]">
                3x = 15!
              </div>
              <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2">
                Отлично 👏 Остался один шаг — как найти <b>x</b>, если 3x = 15?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stages */}
      <section id="stages" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <h2 className="text-center text-5xl sm:text-6xl">Три этапа — 15 уровней</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Двигайтесь в своём темпе: каждый уровень — это несколько коротких уроков с теорией, квизом и задачами.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STAGES.map((stage, i) => (
            <div key={stage.id} className="flex flex-col rounded-3xl border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-heading text-4xl">{stage.title}</span>
                <span className="grid size-9 place-items-center rounded-full bg-muted font-semibold">{i + 1}</span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{stage.subtitle}</p>
              <ol className="space-y-2 text-sm">
                {stage.levels.map((l) => (
                  <li key={l.number} className="flex gap-3">
                    <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">{l.number}</span>
                    <span>{l.title}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-auto pt-5">
                <Badge className={i === 0 ? "bg-[var(--sea)] text-[var(--ink)]" : "bg-[var(--brick)] text-white"}>
                  {i === 0 ? "Базовые темы — в Free" : "Pro"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="scroll-mt-20 bg-[var(--ink)] py-20 text-[var(--mist)]">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-5xl text-[var(--mist)] sm:text-6xl">Как это работает</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-[var(--mist)]/15 bg-[var(--pine)]/40 p-6">
                <Icon className="mb-4 size-7 text-[var(--sea)]" />
                <p className="mb-2 text-lg font-semibold">{title}</p>
                <p className="text-sm text-[var(--mist)]/75">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
        <h2 className="mb-10 text-center text-5xl sm:text-6xl">Тарифы</h2>
        <PricingTable signedIn={!!user} pro={isPro(user)} />
      </section>

      {/* FAQ */}
      <section className="border-t bg-card py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center text-5xl">Вопросы и ответы</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border bg-background px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">{f.q}</summary>
                <p className="mt-2 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
