import { z } from "zod"

/** Normalize Barcelona's cultural agenda into linked, current candidates. */
export function normalizeAgenda(
  /** Records received from the city feed. */
  records: unknown[],
  /** Local calendar date in ISO format. */
  today: string,
) {
  const cutoff = new Date(`${today}T12:00:00Z`)
  cutoff.setUTCDate(cutoff.getUTCDate() + 28)
  const limit = cutoff.toISOString().slice(0, 10)
  return records.flatMap(record => {
    const result = agendaRecord.safeParse(record)
    if (!result.success) return []
    const item = result.data
    const start = item.start_date.slice(0, 10)
    const end = item.end_date.slice(0, 10)
    if (item.status !== "published" || item.event_status !== "ok" || end < today) return []
    const names = item.classifications_data.map(entry => entry.name)
    const category = names.includes("Exposicions")
      ? "Exhibitions"
      : names.includes("Música")
        ? "Music"
        : null
    if (!category || (category === "Music" && (start < today || start > limit || start !== end)))
      return []
    const url = item.values
      .map(value => value.url_value)
      .find(value => value && /^https?:\/\//i.test(value))
    const venue =
      item.addresses.find(address => address.place)?.place ??
      item.addresses[0]?.related_entity_data?.name
    if (!url || !venue) return []
    return [
      {
        id: `bcn:${item.register_id}`,
        title: item.name,
        venue,
        start,
        end,
        category,
        url,
        description: item.body ?? "",
      },
    ]
  })
}

const agendaRecord = z.object({
  register_id: z.number(),
  name: z.string().min(1),
  start_date: z.string().min(10),
  end_date: z.string().min(10),
  status: z.string(),
  event_status: z.string(),
  body: z.string().nullish(),
  classifications_data: z.array(z.object({ name: z.string() })),
  values: z.array(z.object({ url_value: z.string().nullish() })),
  addresses: z.array(
    z.object({
      place: z.string().nullish(),
      related_entity_data: z.object({ name: z.string().nullish() }).nullish(),
    }),
  ),
})
