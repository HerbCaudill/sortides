import { describe, expect, it } from 'vitest'
import { outingSchema, outings } from './outings'

describe('outings data', () => {
  it('contains valid sample outings for each view', () => {
    for (const base of ['Barcelona', 'Tamariu']) for (const mode of ['night', 'day']) expect(outings.some(item => item.base === base && item.mode === mode)).toBe(true)
    expect(outingSchema.safeParse({ ...outings[0], coordinates: [999, 0] }).success).toBe(false)
  })
})
