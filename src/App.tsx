import { useEffect, useMemo, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  IconBuildingSkyscraper,
  IconBeach,
  IconMoon,
  IconSun,
  IconMap,
  IconMusic,
  IconMovie,
  IconTrees,
  IconBuilding,
  IconWalk,
  IconX,
} from "@tabler/icons-react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  outings,
  dayTripsForBase,
  driveMinutes,
  driveGroup,
  eventGroup,
  outingLinks,
  exhibitionClosingDate,
  formatDriveTime,
  type Outing,
} from "./data/outings"
import { UpdateNotice } from "./components/UpdateNotice"
import { OutingPhoto } from "./components/OutingPhoto"
import { nightMapStyle } from "./lib/nightMapStyle"
import { useTodayInCatalonia } from "./lib/useTodayInCatalonia"

/** The outings map and its responsive list. */
export default function App() {
  const [base, setBase] = useState<"Barcelona" | "Tamariu">("Barcelona")
  const [mode, setMode] = useState<"night" | "day">("night")
  const [kind, setKind] = useState("Everything")
  const [selected, setSelected] = useState<Outing | null>(null)
  const [shortcuts, setShortcuts] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const today = useTodayInCatalonia()
  const mapNode = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const mapMode = useRef<"night" | "day">("night")
  const rows = useRef<HTMLDivElement>(null)
  const available = useMemo(
    () =>
      mode === "day"
        ? dayTripsForBase(outings, base, today)
        : outings
            .filter(item => item.mode === "night" && item.bases.some(entry => entry.base === base))
            .filter(item => item.date! >= today)
            .sort((a, b) => a.date!.localeCompare(b.date!)),
    [base, mode, today],
  )
  const visible = useMemo(
    () => available.filter(item => kind === "Everything" || item.kind === kind),
    [available, kind],
  )
  const kinds = Array.from(new Set(available.map(item => item.kind)))
  const groupFor = (item: Outing) =>
    item.mode === "day" ? driveGroup(driveMinutes(item, base)!) : eventGroup(item.date!, today)
  const groups = Array.from(new Set(visible.map(groupFor)))

  useEffect(() => {
    if (!mapNode.current) return
    const instance = new maplibregl.Map({
      container: mapNode.current,
      center: [2.166, 41.392],
      zoom: 13.5,
    })
    instance.setStyle("https://tiles.openfreemap.org/styles/dark", {
      transformStyle: (_previous, next) => nightMapStyle(next),
    })
    instance.addControl(new maplibregl.NavigationControl(), "bottom-right")
    map.current = instance
    return () => {
      instance.remove()
      map.current = null
    }
  }, [])
  useEffect(() => {
    const instance = map.current
    if (!instance) return
    if (mapMode.current !== mode) {
      instance.setStyle(
        `https://tiles.openfreemap.org/styles/${mode === "night" ? "dark" : "liberty"}`,
        { transformStyle: (_previous, next) => (mode === "night" ? nightMapStyle(next) : next) },
      )
      mapMode.current = mode
    }
    const center: [number, number] =
      base === "Tamariu" ? [3.17, 41.92] : mode === "night" ? [2.166, 41.392] : [2.17, 41.39]
    instance.flyTo({
      center,
      zoom: mode === "night" ? (base === "Barcelona" ? 13.5 : 10.3) : 8.2,
      duration: 700,
    })
    const markers = visible.map(item => {
      const node = document.createElement("button")
      node.className = "map-marker " + color(item.kind)
      node.setAttribute("aria-label", item.title)
      node.textContent = item.kind === "Music" ? "♪" : item.kind === "Movies" ? "▣" : "✦"
      node.onclick = event => {
        event.stopPropagation()
        setSelected(item)
        setExpanded(false)
      }
      return new maplibregl.Marker({ element: node }).setLngLat(item.coordinates).addTo(instance)
    })
    return () => {
      markers.forEach(marker => marker.remove())
    }
  }, [base, mode, visible])
  useEffect(() => {
    const instance = map.current
    if (!instance || !selected) return
    const content = document.createElement("div")
    const photoNode = document.createElement("div")
    content.append(photoNode)
    const photoRoot = createRoot(photoNode)
    const heading = document.createElement("strong")
    heading.textContent = selected.title
    const detail = document.createElement("p")
    detail.textContent = `${selected.when} · ${selected.price}`
    const venue = document.createElement("p")
    venue.textContent = selected.venue
    const why = document.createElement("p")
    why.textContent = selected.why
    const context = document.createElement("p")
    context.textContent = selected.context ?? ""
    const actions = document.createElement("p")
    outingLinks(selected).forEach(({ label, url }, index) => {
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.target = "_blank"
      anchor.rel = "noreferrer"
      anchor.textContent = `${label} ↗`
      if (index > 0) actions.append(" · ")
      actions.append(anchor)
    })
    content.append(heading, detail, venue, why)
    const closingDate = exhibitionClosingDate(selected)
    if (closingDate) {
      const dates = document.createElement("p")
      dates.className = "exhibition-dates"
      dates.textContent = closingDate
      heading.after(dates)
    }
    if (selected.context) content.append(context)
    content.append(actions)
    const popup = new maplibregl.Popup({ offset: 22 })
      .setLngLat(selected.coordinates)
      .setDOMContent(content)
      .addTo(instance)
    photoRoot.render(
      <OutingPhoto photo={selected.photo} onLoad={() => popup.setLngLat(selected.coordinates)} />,
    )
    instance.easeTo({ center: selected.coordinates, duration: 500 })
    const closePopup = () => setSelected(null)
    popup.on("close", closePopup)
    return () => {
      popup.off("close", closePopup)
      popup.remove()
      photoRoot.unmount()
    }
  }, [selected])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShortcuts(false)
        setSelected(null)
        ;(document.activeElement as HTMLElement)?.blur()
        return
      }
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        /INPUT|TEXTAREA/.test((event.target as HTMLElement).tagName)
      )
        return
      const key = event.key.toLowerCase()
      if (key === "b") setBase("Barcelona")
      if (key === "t") setBase("Tamariu")
      if (key === "n") setMode("night")
      if (key === "d") setMode("day")
      if (key === "?") setShortcuts(true)
      if (key === "j" || key === "k") {
        event.preventDefault()
        const index = visible.indexOf(selected as Outing)
        const next = key === "j" ? Math.min(index + 1, visible.length - 1) : Math.max(index - 1, 0)
        if (visible[next]) {
          setSelected(visible[next])
          rows.current
            ?.querySelectorAll<HTMLButtonElement>(".outing")
            [next]?.scrollIntoView({ block: "nearest" })
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [visible, selected])
  useEffect(() => {
    setKind("Everything")
    setSelected(null)
  }, [base, mode])

  return (
    <div className="app">
      <div className="map" ref={mapNode} aria-label="Map of outings" />
      <aside className="sidebar">
        <div className="controls">
          <div className="brand">
            <span>
              <IconMap size={21} /> Sortides
            </span>
          </div>
          <div className="toggle" aria-label="Base">
            {(["Barcelona", "Tamariu"] as const).map((value, index) => (
              <button
                key={value}
                className={base === value ? "active" : ""}
                aria-pressed={base === value}
                onClick={() => setBase(value)}
              >
                {value === "Barcelona" ? (
                  <IconBuildingSkyscraper size={16} aria-hidden="true" />
                ) : (
                  <IconBeach size={16} aria-hidden="true" />
                )}
                {value}
                <kbd>{index ? "T" : "B"}</kbd>
              </button>
            ))}
          </div>
          <div className={"toggle mode " + (mode === "night" ? "night" : "")}>
            {(["night", "day"] as const).map(value => (
              <button
                key={value}
                className={mode === value ? "active" : ""}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {value === "night" ? <IconMoon size={16} /> : <IconSun size={16} />}{" "}
                {value === "night" ? "Date nights" : "Day trips"}
                <kbd>{value === "night" ? "N" : "D"}</kbd>
              </button>
            ))}
          </div>
          <div className="desktop-filters">
            <div className="chips">
              {["Everything", ...kinds].map(value => (
                <button
                  key={value}
                  className={kind === value ? "chosen" : ""}
                  onClick={() => setKind(value)}
                >
                  {value}
                  {value !== "Everything" &&
                    ` ${available.filter(item => item.kind === value).length}`}
                </button>
              ))}
            </div>
          </div>
        </div>
        <section className={"sheet " + (expanded ? "expanded" : "collapsed")}>
          <button
            className="sheet-header"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            <span className="handle" />
            <span>
              {visible.length} {mode === "night" ? "date nights" : "day trips"} from {base}
            </span>
            <b>{expanded ? "Map" : "List"}</b>
          </button>
          {selected && !expanded && (
            <div className="phone-detail">
              <OutingPhoto photo={selected.photo} />
              <strong>{selected.title}</strong>
              {exhibitionClosingDate(selected) && (
                <p className="exhibition-dates">{exhibitionClosingDate(selected)}</p>
              )}
              <p>{selected.why}</p>
              {selected.context && <p>{selected.context}</p>}
              <p>
                {outingLinks(selected).map(({ label, url }, index) => (
                  <span key={url}>
                    {index > 0 && " · "}
                    <a href={url} target="_blank" rel="noreferrer">
                      {label} ↗
                    </a>
                  </span>
                ))}
              </p>
            </div>
          )}
          <div className="list" ref={rows}>
            {groups.map(group => (
              <div key={group}>
                <div className="group">
                  <span>{group}</span>
                  <span>{visible.filter(item => groupFor(item) === group).length}</span>
                </div>
                {visible
                  .filter(item => groupFor(item) === group)
                  .map(item => (
                    <button
                      key={item.title}
                      className={"outing " + (selected === item ? "selected" : "")}
                      onClick={() => {
                        setSelected(item)
                        setExpanded(false)
                      }}
                    >
                      <span className={"kind-icon " + color(item.kind)}>{icon(item.kind)}</span>
                      <span className="outing-text">
                        <strong>{item.title}</strong>
                        <small>
                          {item.venue} · {item.price}
                        </small>
                        {exhibitionClosingDate(item) && (
                          <small className="exhibition-dates">{exhibitionClosingDate(item)}</small>
                        )}
                      </span>
                      <span className="when">
                        {item.mode === "day"
                          ? formatDriveTime(driveMinutes(item, base)!)
                          : item.when}
                      </span>
                    </button>
                  ))}
              </div>
            ))}
            {visible.length === 0 && <p className="empty">No outings in this category.</p>}
          </div>
          <div className="footer">
            <button onClick={() => setShortcuts(true)}> ? &nbsp; Shortcuts</button>
          </div>
        </section>
      </aside>
      {shortcuts && (
        <div className="backdrop" onClick={() => setShortcuts(false)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            onClick={event => event.stopPropagation()}
          >
            <button className="close" aria-label="Close" onClick={() => setShortcuts(false)}>
              <IconX size={18} />
            </button>
            <h2>Keyboard shortcuts</h2>
            <p>
              <kbd>B</kbd> Barcelona <kbd>T</kbd> Tamariu
            </p>
            <p>
              <kbd>N</kbd> Date nights <kbd>D</kbd> Day trips
            </p>
            <p>
              <kbd>J</kbd> Next outing <kbd>K</kbd> Previous outing
            </p>
            <p>
              <kbd>Esc</kbd> Close
            </p>
          </div>
        </div>
      )}
      <UpdateNotice />
    </div>
  )
}
/** Map a kind to its accent color. */
function color(kind: string) {
  return kind === "Music"
    ? "orange"
    : kind === "Movies"
      ? "blue"
      : ["Exhibitions", "Museum", "Architecture"].includes(kind)
        ? "purple"
        : "green"
}
/** Give each kind a recognizable icon. */
function icon(kind: string) {
  return kind === "Music" ? (
    <IconMusic size={16} />
  ) : kind === "Movies" ? (
    <IconMovie size={16} />
  ) : ["Exhibitions", "Museum", "Architecture"].includes(kind) ? (
    <IconBuilding size={16} />
  ) : kind === "Walks" || kind === "Hikes" ? (
    <IconWalk size={16} />
  ) : (
    <IconTrees size={16} />
  )
}
