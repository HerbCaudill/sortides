import { z } from 'zod'
import data from './outings.json'

/** Structure of an outing in the editable JSON file. */
export const outingSchema = z.object({
  title: z.string().min(1), kind: z.string().min(1), base: z.enum(['Barcelona', 'Tamariu']),
  mode: z.enum(['night', 'day']), coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  venue: z.string().min(1), when: z.string().min(1), price: z.string().min(1), group: z.string().min(1), why: z.string().min(1),
  links: z.array(z.object({ label: z.string(), url: z.url() })),
})
/** A validated outing. */
export type Outing = z.infer<typeof outingSchema>
/** All locally maintained outings. */
export const outings = z.array(outingSchema).parse(data)
