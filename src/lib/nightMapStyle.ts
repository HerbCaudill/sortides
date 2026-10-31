import type { StyleSpecification } from "maplibre-gl"

/** Lift streets and labels above a subdued blue night basemap. */
export function nightMapStyle(
  /** OpenFreeMap's fetched dark style, including its original sources and credits. */
  style: StyleSpecification,
): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map(layer => {
      if (layer.type === "background")
        return { ...layer, paint: { ...layer.paint, "background-color": "#18212d" } }
      if (layer.type === "symbol" && layer.layout?.["text-field"])
        return {
          ...layer,
          paint: {
            ...layer.paint,
            "text-color": "#e2e8f0",
            "text-halo-color": "#18212d",
            "text-halo-width": 1.5,
            "text-halo-blur": 0,
          },
        }
      if (layer.type === "line" && layer.id.startsWith("highway_"))
        return {
          ...layer,
          paint: {
            ...layer.paint,
            "line-color": layer.id.endsWith("casing") ? "#283545" : "#63758a",
          },
        }
      if (layer.type === "fill") {
        const fill =
          layer.id === "water"
            ? "#101b2a"
            : layer.id === "building"
              ? "#202c3b"
              : layer.id.includes("park") || layer.id.includes("wood")
                ? "#243b38"
                : undefined
        if (fill) return { ...layer, paint: { ...layer.paint, "fill-color": fill } }
      }
      return layer
    }),
  }
}
