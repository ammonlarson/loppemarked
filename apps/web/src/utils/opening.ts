import { OPENING_TIMEZONE } from "@greenspace/shared";

/**
 * Compare current time against the opening datetime.
 * The opening ISO string is wall-clock time in OPENING_TIMEZONE.
 * We build the current wall-clock time in that timezone using Intl,
 * then compare against the opening datetime.
 */
export function isBeforeOpening(openingIso: string): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: OPENING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const nowParts = formatter.formatToParts(new Date());
  const get = (type: string) =>
    nowParts.find((p) => p.type === type)?.value ?? "0";
  const nowInTz = new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`,
  );

  const opening = new Date(openingIso);
  return nowInTz < opening;
}
