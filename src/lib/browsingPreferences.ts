/** Restore valid saved fields while keeping browsing usable when storage is unavailable. */
export function readBrowsingPreferences(): BrowsingPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null")
    return {
      base: saved?.base === "Tamariu" ? "Tamariu" : "Barcelona",
      mode: saved?.mode === "day" ? "day" : "night",
      kind: typeof saved?.kind === "string" ? saved.kind : "Everything",
    }
  } catch {
    return { base: "Barcelona", mode: "night", kind: "Everything" }
  }
}

/** Save the current view without interrupting browsing if storage is blocked or full. */
export function saveBrowsingPreferences(
  /** The validated view to resume on the next visit. */
  preferences: BrowsingPreferences,
) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences))
  } catch {
    // Browsing still works when the browser disallows durable storage.
  }
}

const storageKey = "sortides.browsing-preferences"

/** The controls that define the browsing view. */
export type BrowsingPreferences = {
  /** The starting location. */
  base: "Barcelona" | "Tamariu"
  /** Date nights or activities. */
  mode: "night" | "day"
  /** The selected outing category. */
  kind: string
}
