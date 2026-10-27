import { test, expect } from "@playwright/test"
test("switches views and selects an outing", async ({ page }, testInfo) => {
  await page.goto("/")
  await expect(page.getByText("Marta Roig Quartet").first()).toBeVisible()
  await page
    .getByRole("button", { name: /Tamariu/ })
    .first()
    .click()
  await page
    .getByRole("button", { name: /Day trips/ })
    .first()
    .click()
  await expect(page.getByText("Peratallada").first()).toBeVisible()
  await page.getByRole("button", { name: /Peratallada Peratallada/ }).click()
  await expect(page.getByText("Directions ↗").locator("visible=true").first()).toBeVisible()
  await page.screenshot({ path: `test-results/${testInfo.project.name}.png` })
})

test("changes the map palette with the outing mode", async ({ page }, testInfo) => {
  const nightStyle = page.waitForResponse(
    response => response.url() === "https://tiles.openfreemap.org/styles/dark",
  )
  await page.goto("/")
  await nightStyle
  const dayStyle = page.waitForResponse(
    response => response.url() === "https://tiles.openfreemap.org/styles/liberty",
  )
  await page
    .getByRole("button", { name: /Day trips/ })
    .first()
    .click()
  await dayStyle
  await expect(page.getByText("Aquàrium de Barcelona").first()).toBeVisible()
  const restoredNightStyle = page.waitForResponse(
    response => response.url() === "https://tiles.openfreemap.org/styles/dark",
  )
  await page
    .getByRole("button", { name: /Date nights/ })
    .first()
    .click()
  await restoredNightStyle
  await page.getByRole("button", { name: /Trio Carioca Harlem/ }).click()
  await expect(page.getByText("Directions ↗").locator("visible=true").first()).toBeVisible()
  await page.screenshot({ path: `test-results/${testInfo.project.name}-night.png` })
})
