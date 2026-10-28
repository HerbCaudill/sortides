/** Read the calendar date used by Catalan venues, independent of the viewer’s time zone. */
export function todayInCatalonia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}
