import { test, expect } from '@playwright/test'
test('switches views and selects an outing', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByText('Marta Roig Quartet').first()).toBeVisible()
  await page.getByRole('button', { name: /Tamariu/ }).first().click()
  await page.getByRole('button', { name: /Day trips/ }).first().click()
  await expect(page.getByText('Peratallada').first()).toBeVisible()
  await page.getByRole('button', { name: /Peratallada Peratallada/ }).click()
  await expect(page.getByText('Directions ↗')).toBeVisible()
  await page.screenshot({ path: `test-results/${testInfo.project.name}.png` })
})

