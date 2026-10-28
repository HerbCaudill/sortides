import { useEffect, useState } from "react"
import { todayInCatalonia } from "./todayInCatalonia"

/** Keep exhibition eligibility fresh across midnight and after resuming the app. */
export function useTodayInCatalonia() {
  const [today, setToday] = useState(todayInCatalonia)
  useEffect(() => {
    const refresh = () => setToday(todayInCatalonia())
    const timer = window.setInterval(refresh, 60_000)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [])
  return today
}
