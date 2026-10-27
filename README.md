# Sortides

A static collection of sample outings. Run `pnpm install` and `pnpm dev` to start the site. The map loads styles and tiles from OpenFreeMap over the network; the app itself has no backend.

Edit `src/data/outings.json` to change the outings. `src/data/outings.ts` validates the data at startup. The entries are illustrative mockup content, not verified schedules or prices. Coordinates are approximate. The dashed day-trip circles represent straight-line distance, not driving-time isochrones.

Run `pnpm test`, `pnpm build`, and `pnpm exec playwright test` to check the app. Install the Playwright browsers with `pnpm exec playwright install chromium webkit` if needed.
