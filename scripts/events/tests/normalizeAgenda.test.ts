import { expect, it } from "vitest"
import { normalizeAgenda } from "../normalizeAgenda"

it("keeps dated events with a source link and skips expired or unlinked records", () => {
  const event = {
    register_id: 42,
    name: "A concert",
    start_date: "2026-11-02T20:00:00+01:00",
    end_date: "2026-11-02T22:00:00+01:00",
    status: "published",
    event_status: "ok",
    body: "A jazz quartet",
    classifications_data: [{ name: "Música" }],
    values: [{ url_value: "https://example.org/event" }],
    addresses: [{ place: "A venue" }],
  }
  const events = normalizeAgenda(
    [
      event,
      { ...event, register_id: 43, values: [] },
      { ...event, register_id: 44, end_date: "2026-10-01" },
    ],
    "2026-10-27",
  )
  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({
    id: "bcn:42",
    title: "A concert",
    venue: "A venue",
    category: "Music",
    url: "https://example.org/event",
  })
})
