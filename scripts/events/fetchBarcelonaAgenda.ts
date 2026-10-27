import { normalizeAgenda } from "./normalizeAgenda.ts"

/** Download the current cultural agenda and normalize its candidates. */
export async function fetchBarcelonaAgenda(
  /** Local calendar date in ISO format. */
  today: string,
) {
  const response = await fetch(AGENDA_URL, { signal: AbortSignal.timeout(120_000) })
  if (!response.ok) throw new Error(`Barcelona agenda returned HTTP ${response.status}`)
  const records: unknown = await response.json()
  if (!Array.isArray(records) || records.length === 0)
    throw new Error("Barcelona agenda is empty or invalid")
  const candidates = normalizeAgenda(records, today)
  if (candidates.length === 0) throw new Error("Barcelona agenda has no usable current candidates")
  return candidates
}

const AGENDA_URL =
  "https://opendata-ajuntament.barcelona.cat/data/dataset/2767159c-1c98-46b8-a686-2b25b40cb053/resource/59b9c807-f6c1-4c10-ac51-1ace65485079/download"
