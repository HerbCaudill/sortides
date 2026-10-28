import { z } from "zod"
import { outingSchema } from "../../src/data/outings.ts"
import type { Outing } from "../../src/data/outings.ts"

/** Merge validated selections without losing standing places or repeating an event. */
export function applyRefresh(
  /** Existing public list. */
  existing: Outing[],
  /** Previously judged candidate IDs. */
  history: Record<string, unknown>,
  /** Accepted outings or rejected candidates with a reason. */
  input: unknown,
  /** Calendar date in Catalonia. */
  today: string,
) {
  const decisions = z
    .array(
      z.union([
        z.object({ id: z.string().min(1), outing: outingSchema }),
        z.object({ id: z.string().min(1), reason: z.string().min(1) }),
      ]),
    )
    .parse(input)
  const current = existing.filter(item => (item.endsOn ?? item.date ?? "9999-12-31") >= today)
  const next = [...current]
  const cutoff = new Date(`${today}T12:00:00Z`)
  cutoff.setUTCDate(cutoff.getUTCDate() + 28)
  const limit = cutoff.toISOString().slice(0, 10)
  const judged = { ...history }
  for (const decision of decisions) {
    judged[decision.id] = {
      judgedOn: today,
      accepted: "outing" in decision,
      ...("reason" in decision ? { reason: decision.reason } : {}),
    }
    if (!("outing" in decision)) continue
    const item = decision.outing
    if (!item.links.length) throw new Error("Picks need an event or ticket link")
    if (item.mode === "night" && item.date! > limit)
      throw new Error("Date nights must be within 28 days")
    if (item.mode === "day" && (item.kind !== "Exhibitions" || item.startsOn! > today))
      throw new Error("Daily picks must be current exhibitions or dated music and films")
    if ((item.endsOn ?? item.date ?? "9999-12-31") < today)
      throw new Error("Cannot publish an expired outing")
    const index = next.findIndex(
      other => other.title === item.title && other.venue === item.venue && other.date === item.date,
    )
    if (index >= 0) next[index] = item
    else next.push(item)
  }
  z.array(outingSchema).parse(next)
  return { outings: next, history: judged }
}
