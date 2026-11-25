# MathMentor — персональный AI-репетитор по математике

SaaS на Next.js 15 + shadcn/ui. AI-агент — Google Gemini `gemini-3.5-flash-lite`, оплата — Stripe, вход — Auth.js.
Бэкенд на Neon (проект `super-salad-64297161`, ветка `production`, регион `us-east-2`): Lakebase Postgres через Prisma и Object Storage (бакет `uploads` для фото решений), описаны в [`neon.ts`](neon.ts).

## Тарифы

| | Free | Pro |
|---|---|---|
| Время практики | 10 минут в день, сброс в **12:00 по местному времени** пользователя | без ограничений |
| Уроки | 5 уроков базовых тем (включая умножение и деление) | все 45 уроков, 3 этапа |
| Квизы и задачи | ✓ (проверка ответа: верно/неверно) | ✓ |
| Проверка решений и разбор ошибок | — | ✓ AI находит ошибку и даёт похожую задачу (текст или фото решения) |
| Цена | $0 | $5/мес |

## Программа

- **Начальный** — уровни 1–5: числа и счёт, сложение и вычитание, умножение, деление, простые дроби
- **Продвинутый** — уровни 6–10: дроби и десятичные, проценты, отрицательные числа, линейные уравнения, геометрия
- **Эксперт** — уровни 11–15: квадратные уравнения, функции, тригонометрия, вероятность, производные

Программа хранится в [`src/lib/curriculum.ts`](src/lib/curriculum.ts). Уроки с генератором `gen` создают задачи локально и мгновенно; для остальных задачи генерирует Gemini.

## Запуск

```bash
npm install
npm i -g neon
neon link --project-id super-salad-64297161 --branch production -y   # тянет DATABASE_URL и AWS_* в .env
neon deploy                     # создаёт сервисы из neon.ts (Postgres + бакет uploads)
# в .env добавьте AUTH_SECRET, GEMINI_API_KEY и ключи Stripe (см. .env.example)
npx prisma migrate deploy
npm run dev
```

Для разработки удобно работать в отдельной ветке Neon: `neon checkout dev --create` — своя копия базы и файлов.

### Переменные окружения

- `DATABASE_URL` (pooled, для приложения) и `DATABASE_URL_UNPOOLED` (для миграций Prisma) — из `neon env pull`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION` — Neon Object Storage, из `neon env pull`
- `AUTH_SECRET` — `npx auth secret`
- `GEMINI_API_KEY` — ключ из Google AI Studio
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`
- `NEXT_PUBLIC_APP_URL` — адрес сайта

### Stripe

1. В Stripe Dashboard создайте продукт **MathMentor Pro** с recurring-ценой за месяц. Её ID впишите в `STRIPE_PRICE_PRO_MONTHLY`.
2. Включите Customer Portal (Settings → Billing → Customer portal).
3. Локально перенаправляйте webhook-и:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   В продакшене подпишите endpoint `/api/stripe/webhook` на `checkout.session.completed` и `customer.subscription.*`.

## Как устроен лимит Free

- Страницы урока и практики раз в 15 с шлют heartbeat (`POST /api/usage/heartbeat`), пока вкладка видима; сервер прибавляет 15 с к `DailyUsage`.
- Ключ периода — дата последнего наступившего полудня в часовом поясе пользователя (`currentPeriodKey` в [`src/lib/usage.ts`](src/lib/usage.ts)). Часовой пояс берётся из браузера при регистрации и входе.
- Все AI-эндпоинты проверяют лимит, тариф и доступ к уроку на сервере (`guardPractice` в [`src/lib/api.ts`](src/lib/api.ts)).

## Скрипты

- `npm run dev` / `build` / `start`
- `npm test` — unit-тесты (Vitest)
- `npm run lint`
- `npm run db:migrate` / `db:deploy`
