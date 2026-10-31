import { describe, expect, it } from "vitest"
import { outingSchema, outings, dayTripsForBase, eventGroup, outingLinks } from "./outings"

describe("outings", () => {
  it("preserves optional context for an outing", () => {
    const item = outings[0]!
    expect(outingSchema.parse({ ...item, context: "A distinctive performance." }).context).toBe(
      "A distinctive performance.",
    )
  })
  it("shows shared places in drive-time order for each base", () => {
    const trips = dayTripsForBase(outings, "Tamariu")
    const times = trips.map(
      item => item.bases.find(entry => entry.base === "Tamariu")!.driveMinutes,
    )
    expect(times).toEqual([...times].sort((a, b) => a - b))
    expect(dayTripsForBase(outings, "Barcelona").some(item => item.title === "Peratallada")).toBe(
      true,
    )
    expect(trips.some(item => item.title === "Peratallada")).toBe(true)
  })
  it("requires dated music or film for date nights and supports saved-list metadata", () => {
    const night = outings.find(item => item.mode === "night")!
    expect(outingSchema.safeParse({ ...night, date: undefined }).success).toBe(false)
    expect(outingSchema.safeParse({ ...night, kind: "Outdoors" }).success).toBe(false)
    expect(
      outingSchema.safeParse({
        ...night,
        sourceList: "Want to go",
        mapsUrl: "https://maps.google.com/",
      }).success,
    ).toBe(true)
    expect(
      outings.filter(item => item.title.startsWith("Sunset")).every(item => item.mode === "day"),
    ).toBe(true)
  })
  it("groups a dated event by how soon it happens", () => {
    // Saturday: today and tomorrow are the weekend, and the following Monday starts next week
    expect(eventGroup("2026-10-31", "2026-10-31")).toBe("This weekend")
    expect(eventGroup("2026-11-01", "2026-10-31")).toBe("This weekend")
    expect(eventGroup("2026-11-02", "2026-10-31")).toBe("Next week")
    expect(eventGroup("2026-11-08", "2026-10-31")).toBe("Next week")
    expect(eventGroup("2026-11-09", "2026-10-31")).toBe("Upcoming")
    // Tuesday: weekdays come before the weekend of the same week
    expect(eventGroup("2026-10-29", "2026-10-27")).toBe("This week")
    expect(eventGroup("2026-10-30", "2026-10-27")).toBe("This weekend")
    expect(eventGroup("2026-11-02", "2026-10-27")).toBe("Next week")
    // Sunday: the week ends today
    expect(eventGroup("2026-11-01", "2026-11-01")).toBe("This weekend")
    expect(eventGroup("2026-11-02", "2026-11-01")).toBe("Next week")
  })
  it("lists an outing's own links before directions and its Google Maps page", () => {
    const item = outingSchema.parse({
      ...outings[0]!,
      coordinates: [3.0683, 42.0008],
      mapsUrl: "https://maps.google.com/?cid=1",
      links: [{ label: "Tickets", url: "https://example.com/tickets" }],
    })
    expect(outingLinks(item)).toEqual([
      { label: "Tickets", url: "https://example.com/tickets" },
      {
        label: "Directions",
        url: "https://www.google.com/maps/dir/?api=1&destination=42.0008,3.0683",
      },
      { label: "Google Maps", url: "https://maps.google.com/?cid=1" },
    ])
  })
})
