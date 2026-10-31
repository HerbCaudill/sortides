import { useEffect, useRef, useState } from "react"
import { registerSW } from "virtual:pwa-register"
import { IconRefresh } from "@tabler/icons-react"

/** Offer an explicit update without reloading unsaved work or other open windows. */
export function UpdateNotice(
  /** No external configuration. */
  _props: Props,
) {
  const [waiting, setWaiting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string>()
  const update = useRef<ReturnType<typeof registerSW>>(undefined)
  const readyToReload = useRef(false)
  const requested = useRef(false)

  /** Honor the same draft and local-save guards used when leaving the app. */
  const canReload = () => {
    const leaving = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(leaving)
    if (!leaving.defaultPrevented) return true
    setError("Finish saving your changes, then try again.")
    return false
  }

  useEffect(() => {
    // Strict Mode repeats effects; registration and its callbacks must stay singular.
    if (update.current) return
    update.current = registerSW({
      onNeedRefresh: () => setWaiting(true),
      onNeedReload: () => {
        readyToReload.current = true
        if (requested.current && canReload()) {
          location.reload()
          return
        }
        requested.current = false
        setUpdating(false)
        setWaiting(true)
      },
    })
  }, [])

  /** Activate the downloaded worker, then reload only this consenting window. */
  const installUpdate = async () => {
    if (requested.current) return
    setError(undefined)
    if (!canReload()) return
    if (readyToReload.current) {
      location.reload()
      return
    }
    requested.current = true
    setUpdating(true)
    try {
      await update.current?.(true)
    } catch {
      requested.current = false
      setUpdating(false)
      setError("Could not install the update. Try again.")
    }
  }

  return waiting ? (
    <aside
      aria-label="App update"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 max-w-[calc(100vw-2rem)] rounded-lg border border-[#e2e6eb] bg-white p-3 text-sm shadow-lg"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p role="status" className="m-0">
          An update is ready.
        </p>
        <button
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-transparent bg-[#1f4e79] px-3 py-2 font-semibold whitespace-nowrap text-white hover:bg-[#183e61] disabled:cursor-wait disabled:bg-[#526f89]"
          disabled={updating}
          onClick={() => void installUpdate()}
        >
          <IconRefresh aria-hidden="true" size={18} className="shrink-0" />
          {updating ? "Updating…" : "Update now"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-destructive mt-2 max-w-72">
          {error}
        </p>
      )}
    </aside>
  ) : null
}

type Props = Record<string, never>
