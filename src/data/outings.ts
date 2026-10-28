import { z } from "zod"
import data from "./outings.json"
import { todayInCatalonia } from "../lib/todayInCatalonia"

/** The base used to organize an outing. */
export const baseSchema = z.enum(["Barcelona", "Tamariu"])
/** Structure of an outing in the editable JSON file. */
export const outingSchema = z
  .object({
    title: z.string().min(1),
    kind: z.string().min(1),
    bases: z
      .array(z.object({ base: baseSchema, driveMinutes: z.number().nonnegative() }))
      .min(1)
      .refine(
        entries => new Set(entries.map(entry => entry.base)).size === entries.length,
        "Bases must be unique",
      ),
    mode: z.enum(["night", "day"]),
    coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
    venue: z.string().min(1),
    when: z.string().min(1),
    price: z.string().min(1),
    group: z.string().optional(),
    why: z.string().min(1),
    context: z.string().min(1).optional(),
    date: z.iso.date().optional(),
    startsOn: z.iso.date().optional(),
    endsOn: z.iso.date().optional(),
    sourceList: z.string().min(1).optional(),
    mapsUrl: z.url().optional(),
    photo: z
      .object({
        url: z.union([z.url(), z.string().startsWith("/photos/")]),
        alt: z.string().min(1),
        credit: z.string().min(1),
        sourceUrl: z.url(),
        license: z.string().min(1),
        licenseUrl: z.url(),
      })
      .optional(),
    links: z.array(z.object({ label: z.string(), url: z.url() })),
  })
  .superRefine((item, ctx) => {
    if (item.mode === "night" && (!item.date || !["Music", "Movies"].includes(item.kind)))
      ctx.addIssue({ code: "custom", message: "Date nights must be dated music or films." })
    if (
      item.kind === "Exhibitions" &&
      (!item.startsOn || !item.endsOn || item.startsOn > item.endsOn)
    )
      ctx.addIssue({
        code: "custom",
        message: "Exhibitions must have an ordered opening and closing date.",
      })
  })
/** A validated outing. */
export type Outing = z.infer<typeof outingSchema>
/** A home base. */
export type Base = z.infer<typeof baseSchema>
/** All locally maintained outings. */
export const outings = z.array(outingSchema).parse(data)
/** Show an exhibition’s closing date without duplicating it in display copy. */
export function exhibitionClosingDate(item: Outing) {
  if (item.kind !== "Exhibitions" || !item.endsOn) return undefined
  return `Until ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${item.endsOn}T12:00:00Z`))}`
}
/** Get the recorded drive time for a base. */
export function driveMinutes(item: Outing, base: Base) {
  return item.bases.find(entry => entry.base === base)?.driveMinutes
}
/** Return a base’s day trips in ascending drive-time order. */
export function dayTripsForBase(
  /** Validated places and exhibitions. */
  items: Outing[],
  /** Base to calculate eligibility and drive time from. */
  base: Base,
  /** Current date in Catalonia, overridable for deterministic checks. */
  today = todayInCatalonia(),
) {
  return items
    .filter(item => item.mode === "day" && driveMinutes(item, base) !== undefined)
    .filter(
      item => item.kind !== "Exhibitions" || (item.startsOn! <= today && item.endsOn! >= today),
    )
    .sort((a, b) => driveMinutes(a, base)! - driveMinutes(b, base)!)
}
/** Links to show for an outing: its own links, then directions and its Google Maps page. */
export function outingLinks(item: Outing) {
  const [longitude, latitude] = item.coordinates
  return [
    ...item.links,
    {
      label: "Directions",
      url: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    },
    ...(item.mapsUrl ? [{ label: "Google Maps", url: item.mapsUrl }] : []),
  ]
}
/** Group a drive time into useful ranges. */
export function driveGroup(minutes: number) {
  return minutes <= 30
    ? "Up to 30 min"
    : minutes <= 60
      ? "30 min – 1 hour"
      : minutes <= 120
        ? "1 – 2 hours"
        : "Over 2 hours"
}
/** Format a drive time for the list. */
export function formatDriveTime(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours} h${rest ? ` ${rest} min` : ""}`
}
