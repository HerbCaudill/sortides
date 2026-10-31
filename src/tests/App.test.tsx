import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import App from "../App"

const map = vi.hoisted(() => ({
  flyTo: vi.fn(),
  setStyle: vi.fn(),
  addControl: vi.fn(),
  remove: vi.fn(),
}))
const markers = vi.hoisted(() => ({ titles: [] as string[] }))
vi.mock("maplibre-gl", () => ({
  Map: class {
    constructor() {
      return map
    }
  },
  NavigationControl: class {},
  Marker: class {
    constructor(options: { element: HTMLElement }) {
      markers.titles.push(options.element.getAttribute("aria-label")!)
    }
    setLngLat() {
      return this
    }
    addTo() {
      return this
    }
    remove() {}
  },
}))
vi.mock("../components/UpdateNotice", () => ({ UpdateNotice: () => null }))
vi.mock("../lib/useTodayInCatalonia", () => ({ useTodayInCatalonia: () => "2026-10-31" }))
vi.mock("../data/outings", async importOriginal => {
  const original = await importOriginal<typeof import("../data/outings")>()
  return {
    ...original,
    outings: [
      {
        title: "Coastal walk",
        kind: "Walks",
        mode: "day",
        bases: [{ base: "Tamariu", driveMinutes: 10 }],
        coordinates: [3, 42],
        venue: "Coast",
        price: "Free",
        when: "Any day",
        why: "Walk",
        links: [],
      },
      {
        title: "Local museum",
        kind: "Museum",
        mode: "day",
        bases: [{ base: "Tamariu", driveMinutes: 20 }],
        coordinates: [3, 42],
        venue: "Museum",
        price: "Free",
        when: "Any day",
        why: "Art",
        links: [],
      },
    ],
  }
})
beforeEach(() => {
  localStorage.clear()
  markers.titles = []
  vi.clearAllMocks()
})
afterEach(cleanup)
it("restores controls, filtered outings, and map after keyboard and category changes", () => {
  const first = render(<App />)
  fireEvent.keyDown(window, { key: "t" })
  fireEvent.keyDown(window, { key: "d" })
  fireEvent.click(screen.getByRole("button", { name: "Walks 1" }))
  first.unmount()
  markers.titles = []
  render(<App />)
  expect(screen.getByRole("button", { name: /^Tamariu/ })).toHaveAttribute("aria-pressed", "true")
  expect(screen.getByRole("button", { name: /^Activities/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  )
  expect(screen.getByRole("button", { name: /Coastal walk/ })).toBeInTheDocument()
  expect(screen.queryByRole("button", { name: /Local museum/ })).not.toBeInTheDocument()
  expect(markers.titles).toEqual(["Coastal walk"])
  expect(map.flyTo).toHaveBeenLastCalledWith(
    expect.objectContaining({ center: [3.17, 41.92], zoom: 8.2 }),
  )
  expect(map.setStyle).toHaveBeenLastCalledWith(
    "https://tiles.openfreemap.org/styles/liberty",
    expect.any(Object),
  )
})
it.each([null, "broken", "[]", JSON.stringify({ base: "Elsewhere", mode: "invalid", kind: 7 })])(
  "uses defaults for missing or invalid saved preferences: %s",
  saved => {
    if (saved !== null) localStorage.setItem("sortides.browsing-preferences", saved)
    render(<App />)
    expect(screen.getByRole("button", { name: /^Barcelona/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByRole("button", { name: /^Date nights/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(JSON.parse(localStorage.getItem("sortides.browsing-preferences")!)).toEqual({
      base: "Barcelona",
      mode: "night",
      kind: "Everything",
    })
  },
)
it("falls back from a category no longer available in the saved view", () => {
  localStorage.setItem(
    "sortides.browsing-preferences",
    JSON.stringify({ base: "Tamariu", mode: "day", kind: "Obsolete" }),
  )
  render(<App />)
  expect(screen.getByRole("button", { name: /Coastal walk/ })).toBeInTheDocument()
  expect(screen.getByRole("button", { name: /Local museum/ })).toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem("sortides.browsing-preferences")!).kind).toBe("Everything")
})
it("persists mouse changes and resets the category when changing mode", () => {
  render(<App />)
  fireEvent.click(screen.getByRole("button", { name: /^Tamariu/ }))
  fireEvent.click(screen.getByRole("button", { name: /^Activities/ }))
  fireEvent.click(screen.getByRole("button", { name: "Walks 1" }))
  fireEvent.click(screen.getByRole("button", { name: /^Date nights/ }))
  expect(JSON.parse(localStorage.getItem("sortides.browsing-preferences")!)).toEqual({
    base: "Tamariu",
    mode: "night",
    kind: "Everything",
  })
})
it("keeps browsing usable when browser storage is blocked", () => {
  const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Blocked")
  })
  const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Full")
  })
  try {
    render(<App />)
    fireEvent.keyDown(window, { key: "d" })
    expect(screen.getByRole("button", { name: /^Activities/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  } finally {
    read.mockRestore()
    write.mockRestore()
  }
})
