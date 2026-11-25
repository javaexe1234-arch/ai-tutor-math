import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { isValidTimeZone } from "@/lib/usage";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  timezone: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте имя, email и пароль (минимум 6 символов)." }, { status: 400 });
  }
  const { name, password, timezone } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Пользователь с таким email уже существует." }, { status: 409 });
  }

  await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      timezone: timezone && isValidTimeZone(timezone) ? timezone : "Europe/Moscow",
    },
  });
  return NextResponse.json({ ok: true });
}
