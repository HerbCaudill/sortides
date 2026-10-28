import { expect, it } from "vitest"
import { applyRefresh } from "../applyRefresh"
import { outings } from "../../../src/data/outings"

it("preserves places, removes expired events, deduplicates picks and remembers rejections", () => {
  const place = outings.find(item => item.mode === "day" && item.kind !== "Exhibitions")!
  const pick = {
    ...place,
    title: "A concert",
    kind: "Music",
    mode: "night" as const,
    date: "2026-11-02",
    links: [{ label: "Tickets", url: "https://example.com/concert" }],
  }
  const expired = { ...pick, date: "2026-10-01" }
  const result = applyRefresh(
    [place, expired],
    {},
    [
      { id: "yes", outing: pick },
      { id: "duplicate", outing: pick },
      { id: "no", reason: "Not a fit" },
    ],
    "2026-10-28",
  )
  expect(result.outings).toEqual([place, pick])
  expect(Object.keys(result.history)).toEqual(["yes", "duplicate", "no"])
  expect(() =>
    applyRefresh([], {}, [{ id: "no-link", outing: { ...pick, links: [] } }], "2026-10-28"),
  ).toThrow()
  expect(() =>
    applyRefresh(
      [],
      {},
      [{ id: "too-far", outing: { ...pick, date: "2027-01-01" } }],
      "2026-10-28",
    ),
  ).toThrow()
  expect(() =>
    applyRefresh([place], {}, [{ id: "invalid", outing: { title: "Incomplete" } }], "2026-10-28"),
  ).toThrow()
})
