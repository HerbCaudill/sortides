import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { useTodayInCatalonia } from "../useTodayInCatalonia"

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
it("changes the exhibition date when an open app crosses midnight in Catalonia", () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-11-08T22:59:50Z"))
  const { result } = renderHook(useTodayInCatalonia)
  expect(result.current).toBe("2026-11-08")
  act(() => {
    vi.advanceTimersByTime(60_000)
  })
  expect(result.current).toBe("2026-11-09")
})
