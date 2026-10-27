import { describe, expect, it } from "vitest"
import { outingSchema, outings } from "../outings"

describe("outing photos", () => {
  it("keeps an optional photo and its attribution when validating data", () => {
    const photo = {
      url: "/photos/besalu.webp",
      alt: "The medieval bridge at Besalú",
      credit: "Mikipons",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Pont_Besal%C3%BA_1.jpg",
      license: "CC BY-SA 3.0 es",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/es/",
    }
    expect(outingSchema.parse({ ...outings[0], photo }).photo).toEqual(photo)
    expect(
      outingSchema.safeParse({ ...outings[0], photo: { ...photo, sourceUrl: "invalid" } }).success,
    ).toBe(false)
  })
})

