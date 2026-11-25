import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { apiError } from "@/lib/api";
import { isPro } from "@/lib/plans";
import { saveSolutionImage, SOLUTION_IMAGE_MAX_BYTES, SOLUTION_IMAGE_TYPES, solutionImageUrl } from "@/lib/storage";

/** Pro: upload a photo of a handwritten solution to Neon Object Storage. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Войдите в аккаунт.");
  if (!isPro(user)) return apiError("PRO_REQUIRED", "Проверка решения по фото доступна в тарифе Pro.");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return apiError("BAD_REQUEST", "Прикрепите фото решения.");
  if (!(SOLUTION_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return apiError("BAD_REQUEST", "Поддерживаются JPG, PNG, WEBP и HEIC.");
  }
  if (file.size > SOLUTION_IMAGE_MAX_BYTES) return apiError("BAD_REQUEST", "Фото больше 5 МБ.");

  try {
    const key = await saveSolutionImage(user.id, new Uint8Array(await file.arrayBuffer()), file.type);
    return NextResponse.json({ key, url: await solutionImageUrl(key) });
  } catch (e) {
    console.error("solution upload failed", e);
    return NextResponse.json({ error: "Не удалось загрузить фото." }, { status: 500 });
  }
}
