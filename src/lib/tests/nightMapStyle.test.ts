import { expect, test } from "vitest"
import type { StyleSpecification } from "maplibre-gl"
import { nightMapStyle } from "../nightMapStyle"

test("makes streets and neighborhood labels readable while preserving the map source", () => {
  const style: StyleSpecification = {
    version: 8,
    sources: {
      base: { type: "vector", url: "https://example.com/tiles.json", attribution: "Map credit" },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#0c0c0c" } },
      {
        id: "highway_minor",
        type: "line",
        source: "base",
        paint: { "line-color": "#181818", "line-width": 2 },
      },
      {
        id: "place_suburb",
        type: "symbol",
        source: "base",
        layout: { "text-field": "Eixample" },
        paint: { "text-color": "#656565" },
      },
    ],
  }
  const result = nightMapStyle(style)
  expect(result.layers[0].paint).toMatchObject({ "background-color": "#18212d" })
  expect(result.layers[1].paint).toMatchObject({ "line-color": "#63758a", "line-width": 2 })
  expect(result.layers[2].paint).toMatchObject({
    "text-color": "#e2e8f0",
    "text-halo-color": "#18212d",
  })
  expect(result.sources).toEqual(style.sources)
  expect(style.layers[1].paint).toMatchObject({ "line-color": "#181818" })
})
