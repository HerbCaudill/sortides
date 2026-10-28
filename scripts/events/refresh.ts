import { mkdir, readFile, writeFile } from "node:fs/promises"
import { fetchBarcelonaAgenda } from "./fetchBarcelonaAgenda.ts"
import { applyRefresh } from "./applyRefresh.ts"
import { todayInCatalonia } from "../../src/lib/todayInCatalonia.ts"

const today = todayInCatalonia()
const command = process.argv[2]
const historyPath = "data/events/judged.json"
const history = JSON.parse(await readFile(historyPath, "utf8"))
await mkdir(".events", { recursive: true })
if (command === "fetch") {
  try {
    const candidates = await fetchBarcelonaAgenda(today)
    await writeFile(
      `.events/${today}-candidates.json`,
      JSON.stringify(
        candidates.filter(item => !history[item.id]),
        null,
        2,
      ) + "\n",
    )
    console.log(
      `${candidates.length} current candidates; saved unjudged candidates to .events/${today}-candidates.json`,
    )
  } catch (error) {
    await writeFile(`.events/${today}-fetch-error.txt`, String(error))
    throw error
  }
} else if (command === "apply") {
  const path = process.argv[3]
  if (!path) throw new Error("Usage: pnpm events:apply <decisions.json>")
  const existing = JSON.parse(await readFile("src/data/outings.json", "utf8"))
  const result = applyRefresh(existing, history, JSON.parse(await readFile(path, "utf8")), today)
  // Validate the entire batch before changing either public data or selection history.
  await writeFile("src/data/outings.json", JSON.stringify(result.outings, null, 2) + "\n")
  await writeFile(historyPath, JSON.stringify(result.history, null, 2) + "\n")
  console.log(
    `Validated ${result.outings.length} outings and ${Object.keys(result.history).length} decisions`,
  )
} else throw new Error("Expected fetch or apply")
