import { describe, expect, it } from "vitest"
import { outingSchema, outings, dayTripsForBase } from "./outings"

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
})
