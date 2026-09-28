import { describe, expect, it } from 'vitest'
import stylesheet from '../src/styles.css?raw'

const white = '#ffffff'
const minimumFocusIndicatorContrast = 3

function relativeLuminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16) / 255)

  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hexadecimal color, received ${hex}`)
  }

  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ))

  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)
}

function contrastRatio(foreground: string, background: string) {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)]
    .sort((left, right) => right - left)

  return (lighter + 0.05) / (darker + 0.05)
}

describe('focus indicator contrast', () => {
  it('uses an outline color with at least 3:1 contrast against the white application surface', () => {
    const focusRule = stylesheet.match(/input:focus-visible,\s*button:focus-visible\s*\{([^}]*)\}/)
    const outlineColor = focusRule?.[1].match(/outline:\s*3px solid\s*(#[0-9a-fA-F]{6})/i)?.[1]

    expect(outlineColor).toMatch(/^#[0-9a-f]{6}$/i)
    expect(contrastRatio(outlineColor ?? '#ffffff', white)).toBeGreaterThanOrEqual(
      minimumFocusIndicatorContrast,
    )
  })
})
