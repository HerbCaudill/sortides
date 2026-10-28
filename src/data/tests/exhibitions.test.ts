import { describe, expect, it } from "vitest"
import { dayTripsForBase, exhibitionClosingDate, outingSchema, outings } from "../outings"

describe("exhibition outings", () => {
  const place = outings.find(item => item.mode === "day")!
  const exhibition = {
    ...place,
    kind: "Exhibitions",
    startsOn: "2026-10-01",
    endsOn: "2026-11-08",
    bases: [{ base: "Barcelona" as const, driveMinutes: 15 }],
  }
  it("requires an ordered exhibition date range", () => {
    expect(outingSchema.safeParse({ ...exhibition, endsOn: undefined }).success).toBe(false)
    expect(outingSchema.safeParse({ ...exhibition, endsOn: "2026-09-01" }).success).toBe(false)
    expect(outingSchema.parse(exhibition).endsOn).toBe("2026-11-08")
  })
  it("shows exhibitions only during their run, including opening and closing days", () => {
    const items = [outingSchema.parse(exhibition)]
    expect(dayTripsForBase(items, "Barcelona", "2026-09-30")).toHaveLength(0)
    expect(dayTripsForBase(items, "Barcelona", "2026-10-01")).toHaveLength(1)
    expect(dayTripsForBase(items, "Barcelona", "2026-11-08")).toHaveLength(1)
    expect(dayTripsForBase(items, "Barcelona", "2026-11-09")).toHaveLength(0)
  })
  it("formats the closing date from the structured exhibition dates", () => {
    expect(exhibitionClosingDate(outingSchema.parse(exhibition))).toBe("Until 8 Nov 2026")
    expect(exhibitionClosingDate(place)).toBeUndefined()
  })
})
