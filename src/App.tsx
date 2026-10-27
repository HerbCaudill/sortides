import { useEffect, useMemo, useRef, useState } from 'react'
import { IconHome, IconMoon, IconSun, IconSearch, IconMap, IconMusic, IconMovie, IconTrees, IconBuilding, IconWalk, IconX } from '@tabler/icons-react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { outings, type Outing } from './data/outings'
import { UpdateNotice } from './components/UpdateNotice'

/** The outings map and its responsive list. */
export default function App() {
  const [base, setBase] = useState<'Barcelona' | 'Tamariu'>('Barcelona')
  const [mode, setMode] = useState<'night' | 'day'>('night')
  const [kind, setKind] = useState('Everything')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Outing | null>(null)
  const [shortcuts, setShortcuts] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const mapNode = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const search = useRef<HTMLInputElement>(null)
  const rows = useRef<HTMLDivElement>(null)
  const available = useMemo(() => outings.filter(item => item.base === base && item.mode === mode), [base, mode])
  const visible = useMemo(() => available.filter(item => (kind === 'Everything' || item.kind === kind) && `${item.title} ${item.venue} ${item.why}`.toLowerCase().includes(query.toLowerCase())), [available, kind, query])
  const kinds = Array.from(new Set(available.map(item => item.kind)))
  const groups = Array.from(new Set(visible.map(item => item.group)))

  useEffect(() => {
    if (!mapNode.current) return
    const instance = new maplibregl.Map({ container: mapNode.current, style: 'https://tiles.openfreemap.org/styles/liberty', center: [2.17, 41.39], zoom: 12 })
    instance.addControl(new maplibregl.NavigationControl(), 'bottom-right')
    map.current = instance
    return () => { instance.remove(); map.current = null }
  }, [])
  useEffect(() => {
    const instance = map.current
    if (!instance) return
    const center: [number, number] = base === 'Barcelona' ? [2.17, 41.39] : [3.17, 41.92]
    instance.flyTo({ center, zoom: mode === 'night' ? (base === 'Barcelona' ? 12.2 : 10.3) : 8.2, duration: 700 })
    const drawRings = () => {
      if (!instance.getSource('rings')) {
        instance.addSource('rings', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        instance.addLayer({ id: 'rings', type: 'line', source: 'rings', paint: { 'line-color': '#1f4e79', 'line-opacity': 0.55, 'line-width': 1.5, 'line-dasharray': [3, 4] } })
      }
      const features = mode === 'day' ? [25, 50].map(radius => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: Array.from({ length: 129 }, (_, i) => { const angle = i * Math.PI * 2 / 128; return [center[0] + radius * Math.cos(angle) / (111 * Math.cos(center[1] * Math.PI / 180)), center[1] + radius * Math.sin(angle) / 111] }) } })) : []
      ;(instance.getSource('rings') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features })
    }
    if (instance.isStyleLoaded()) drawRings(); else instance.once('load', drawRings)
    const markers = visible.map(item => {
      const node = document.createElement('button')
      node.className = 'map-marker ' + color(item.kind)
      node.setAttribute('aria-label', item.title)
      node.textContent = item.kind === 'Music' ? '♪' : item.kind === 'Movies' ? '▣' : '✦'
      node.onclick = event => { event.stopPropagation(); setSelected(item); setExpanded(false) }
      return new maplibregl.Marker({ element: node }).setLngLat(item.coordinates).addTo(instance)
    })
    return () => { instance.off('load', drawRings); markers.forEach(marker => marker.remove()) }
  }, [base, mode, visible])
  useEffect(() => {
    const instance = map.current
    if (!instance || !selected) return
    const content = document.createElement('div')
    const heading = document.createElement('strong'); heading.textContent = selected.title
    const detail = document.createElement('p'); detail.textContent = `${selected.when} · ${selected.price}`
    const venue = document.createElement('p'); venue.textContent = selected.venue
    const why = document.createElement('p'); why.textContent = selected.why
    const link = document.createElement('a'); link.href = `https://www.google.com/maps/dir/?api=1&destination=${selected.coordinates[1]},${selected.coordinates[0]}`; link.target = '_blank'; link.rel = 'noreferrer'; link.textContent = 'Directions ↗'
    content.append(heading, detail, venue, why, link)
    const popup = new maplibregl.Popup({ offset: 22 }).setLngLat(selected.coordinates).setDOMContent(content).addTo(instance)
    instance.easeTo({ center: selected.coordinates, duration: 500 })
    const closePopup = () => setSelected(null)
    popup.on('close', closePopup)
    return () => { popup.off('close', closePopup); popup.remove() }
  }, [selected])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setShortcuts(false); setSelected(null); (document.activeElement as HTMLElement)?.blur(); return }
      if (event.metaKey || event.ctrlKey || event.altKey || /INPUT|TEXTAREA/.test((event.target as HTMLElement).tagName)) return
      const key = event.key.toLowerCase()
      if (key === 'b') setBase('Barcelona')
      if (key === 't') setBase('Tamariu')
      if (key === 'n') setMode('night')
      if (key === 'd') setMode('day')
      if (key === '/') { event.preventDefault(); search.current?.focus() }
      if (key === '?') setShortcuts(true)
      if (key === 'j' || key === 'k') {
        event.preventDefault(); const index = visible.indexOf(selected as Outing); const next = key === 'j' ? Math.min(index + 1, visible.length - 1) : Math.max(index - 1, 0)
        if (visible[next]) { setSelected(visible[next]); rows.current?.querySelectorAll<HTMLButtonElement>('.outing')[next]?.scrollIntoView({ block: 'nearest' }) }
      }
    }
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler)
  }, [visible, selected])
  useEffect(() => { setKind('Everything'); setSelected(null) }, [base, mode])

  return <div className="app">
    <div className="map" ref={mapNode} aria-label="Map of outings" />
    <aside className="sidebar">
      <div className="controls">
        <div className="brand"><span><IconMap size={21} /> Sortides</span><button className="search-button" aria-label="Focus search" onClick={() => search.current?.focus()}><IconSearch size={18}/><kbd>/</kbd></button></div>
        <div className="toggle" aria-label="Base">{(['Barcelona', 'Tamariu'] as const).map((value, index) => <button key={value} className={base === value ? 'active' : ''} aria-pressed={base === value} onClick={() => setBase(value)}><IconHome size={16}/>{value}<kbd>{index ? 'T' : 'B'}</kbd></button>)}</div>
        <div className={'toggle mode ' + (mode === 'night' ? 'night' : '')}>{(['night', 'day'] as const).map(value => <button key={value} className={mode === value ? 'active' : ''} aria-pressed={mode === value} onClick={() => setMode(value)}>{value === 'night' ? <IconMoon size={16}/> : <IconSun size={16}/>} {value === 'night' ? 'Date nights' : 'Day trips'}<kbd>{value === 'night' ? 'N' : 'D'}</kbd></button>)}</div>
        <div className="desktop-filters"><div className="search-wrap"><IconSearch size={16}/><input ref={search} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search outings" aria-label="Search outings"/></div><div className="chips">{['Everything', ...kinds].map(value => <button key={value} className={kind === value ? 'chosen' : ''} onClick={() => setKind(value)}>{value}{value !== 'Everything' && ` ${available.filter(item => item.kind === value).length}`}</button>)}</div></div>
      </div>
      <section className={'sheet ' + (expanded ? 'expanded' : 'collapsed')}>
        <button className="sheet-header" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}><span className="handle"/><span>{visible.length} {mode === 'night' ? 'date nights' : 'day trips'} from {base}</span><b>{expanded ? 'Map' : 'List'}</b></button>
        <div className="mobile-search"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search outings" aria-label="Search outings on phone"/></div>
        <div className="list" ref={rows}>{groups.map(group => <div key={group}><div className="group"><span>{group}</span><span>{visible.filter(item => item.group === group).length}</span></div>{visible.filter(item => item.group === group).map(item => <button key={item.title} className={'outing ' + (selected === item ? 'selected' : '')} onClick={() => { setSelected(item); setExpanded(false) }}><span className={'kind-icon ' + color(item.kind)}>{icon(item.kind)}</span><span className="outing-text"><strong>{item.title}</strong><small>{item.venue} · {item.price}</small></span><span className="when">{item.when}</span></button>)}</div>)}{visible.length === 0 && <p className="empty">No outings match your search.</p>}</div>
        <div className="footer"><span>Sample outings</span><button onClick={() => setShortcuts(true)}> ? &nbsp; Shortcuts</button></div>
      </section>
    </aside>
    {mode === 'day' && <div className="ring-note">Dashed rings show approximate distance, not driving time</div>}
    {shortcuts && <div className="backdrop" onClick={() => setShortcuts(false)}><div className="dialog" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={event => event.stopPropagation()}><button className="close" aria-label="Close" onClick={() => setShortcuts(false)}><IconX size={18}/></button><h2>Keyboard shortcuts</h2><p><kbd>B</kbd> Barcelona <kbd>T</kbd> Tamariu</p><p><kbd>N</kbd> Date nights <kbd>D</kbd> Day trips</p><p><kbd>J</kbd> Next outing <kbd>K</kbd> Previous outing</p><p><kbd>/</kbd> Search <kbd>Esc</kbd> Close</p></div></div>}
    <UpdateNotice />
  </div>
}
/** Map a kind to its accent color. */
function color(kind: string) { return kind === 'Music' ? 'orange' : kind === 'Movies' ? 'blue' : kind === 'Exhibitions' ? 'purple' : 'green' }
/** Give each kind a recognizable icon. */
function icon(kind: string) { return kind === 'Music' ? <IconMusic size={16}/> : kind === 'Movies' ? <IconMovie size={16}/> : kind === 'Exhibitions' ? <IconBuilding size={16}/> : kind === 'Walks' || kind === 'Hikes' ? <IconWalk size={16}/> : <IconTrees size={16}/> }


