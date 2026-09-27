// Tests for pilot.js: the Coming-soon switch and the exact SMS link.

import { describe, expect, it } from 'vitest'
import { PILOT, buildSmsLink, isPilotReady } from './pilot.js'

describe('isPilotReady', () => {
  it('is false while the settings are PLACEHOLDER (as committed)', () => {
    expect(isPilotReady(PILOT)).toBe(false)
  })

  it('needs both the number and the form link', () => {
    expect(isPilotReady({ smsNumber: '+15595550123', formUrl: 'PLACEHOLDER' })).toBe(false)
    expect(isPilotReady({ smsNumber: '+15595550123', formUrl: 'https://forms.gle/x' })).toBe(true)
  })
})

describe('buildSmsLink', () => {
  it('builds the sms: link both iPhone and Android accept', () => {
    expect(buildSmsLink('+15595550123', 'Hi Cambio')).toBe('sms:+15595550123?&body=Hi%20Cambio')
  })

  it('encodes accents, spaces, and & so the whole message survives', () => {
    expect(buildSmsLink('+15595550123', 'Hola, quiero unirme al piloto & más')).toBe(
      'sms:+15595550123?&body=Hola%2C%20quiero%20unirme%20al%20piloto%20%26%20m%C3%A1s',
    )
  })

  it('strips spaces and punctuation from the number', () => {
    expect(buildSmsLink('(559) 555-0123', 'x')).toBe('sms:5595550123?&body=x')
    expect(buildSmsLink(' +1 559 555 0123 ', 'x')).toBe('sms:+15595550123?&body=x')
  })
})
