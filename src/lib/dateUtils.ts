import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * Returns today's date in Brazilian timezone (America/Sao_Paulo) formatted as YYYY-MM-DD.
 * This ensures all users in the same business see the same "today" regardless of their local timezone.
 */
export const getTodayBrazil = (): string => {
  const now = new Date();
  const brazilTime = toZonedTime(now, "America/Sao_Paulo");
  return format(brazilTime, "yyyy-MM-dd");
};
