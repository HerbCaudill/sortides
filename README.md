# Sortides

A static collection of sample outings. Run `pnpm install` and `pnpm dev` to start the site. The map loads styles and tiles from OpenFreeMap over the network; the app itself has no backend.

Edit `src/data/outings.json` to change the outings. `src/data/outings.ts` validates the data at startup. The entries are illustrative mockup content, not verified schedules or prices. Coordinates are approximate. The dashed day-trip circles represent straight-line distance, not driving-time isochrones.

Run `pnpm test`, `pnpm build`, and `pnpm exec playwright test` to check the app. Install the Playwright browsers with `pnpm exec playwright install chromium webkit` if needed.

For each day trip, `bases` lists the eligible bases and an estimated `driveMinutes` from each. Include both bases when both are within 120 minutes. If neither is within 120 minutes, include only the nearer base. The sample drive times are illustrative estimates; replace them with researched values. Date nights must have a date and a Music or Movies kind. `sourceList` and `mapsUrl` are optional fields for future saved-list imports.
