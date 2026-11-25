/** Free-practice topics. Free users may practise only the basic ones. */
export const FREE_TOPICS = ["Сложение и вычитание", "Умножение", "Деление", "Таблица умножения"] as const;

export const PRO_TOPICS = [
  "Дроби",
  "Проценты",
  "Отрицательные числа",
  "Линейные уравнения",
  "Геометрия",
  "Квадратные уравнения",
  "Функции",
  "Тригонометрия",
  "Вероятность",
  "Производные",
] as const;

export function isFreeTopic(topic: string | undefined): boolean {
  return !topic || (FREE_TOPICS as readonly string[]).includes(topic);
}
