// @vitest-environment jsdom
//
// Step 4 cases the real data can't show today:
//   - the pilot buttons once config/pilot.js has real (team) details
//   - "nothing easy saves money yet", using the losing-prices FIXTURE
//     from src/test-fixtures/ (every swap costs more than it saves)
// The component gets its data and pilot details as props, so a test can
// hand it made-up ones without touching the real files.

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../../i18n/languageContext.js'
import LanguageProvider from '../../i18n/LanguageProvider.jsx'
import { assumptions } from '../../lib/loadAssumptions.js'
import { parseItemsCsv } from '../../lib/loadItems.js'
import { parseSwapsCsv } from '../../lib/loadSwaps.js'
import losingItemsCsv from '../../test-fixtures/losing-items.csv?raw'
import losingSwapsCsv from '../../test-fixtures/losing-swaps.csv?raw'
import StepFirstSwitch from './StepFirstSwitch.jsx'

const losingData = {
  swapItems: parseSwapsCsv(losingSwapsCsv),
  itemProfiles: parseItemsCsv(losingItemsCsv),
  assumptions,
}
const flow = {
  step: 4,
  customersPerDay: '120',
  daysOpen: 6,
  dineInPct: 50,
  washMethod: 'dishwasher',
  overrides: {},
  extrasAuto: 'yes',
  deliveryApps: 'no',
}
// Made-up team details in the documented format (555 numbers are fictional).
const readyPilot = {
  smsNumber: '+15595550123',
  formUrl: 'https://forms.gle/example',
}

function renderStep(props) {
  return render(
    <LanguageProvider>
      <StepFirstSwitch
        flow={flow}
        onChange={() => {}}
        onBack={() => {}}
        onReset={() => {}}
        {...props}
      />
    </LanguageProvider>,
  )
}

beforeEach(() => window.localStorage.clear())
afterEach(cleanup)

describe('Join the pilot, once the team details are filled in', () => {
  it('texts the team with a message in Spanish when the screen is in Spanish', () => {
    window.localStorage.setItem(STORAGE_KEY, 'es')
    renderStep({ pilot: readyPilot })
    const text = screen.getByRole('link', {
      name: 'Envíenos un mensaje de texto',
    })
    expect(text.getAttribute('href')).toBe(
      'sms:+15595550123?&body=Hola%2C%20quiero%20unirme%20al%20piloto%20de%20Cambio.',
    )
    expect(screen.queryByText(/próximamente/)).toBeNull()
  })

  it('opens the form in a new tab', () => {
    renderStep({ pilot: readyPilot })
    const form = screen.getByRole('link', { name: 'Fill out a short form' })
    expect(form.getAttribute('href')).toBe('https://forms.gle/example')
    expect(form.getAttribute('target')).toBe('_blank')
  })
})

describe('when no swap saves money', () => {
  it('starts with takeout extras if they go in every bag', () => {
    renderStep({ data: losingData })
    expect(screen.getByText('Forks and sauce only when asked')).toBeTruthy()
    expect(screen.getByLabelText('Stop putting forks and sauce in every bag')).toBeTruthy()
  })

  it('shows the extras savings once, in the pick, not again under Takeout', () => {
    renderStep({ data: losingData })
    // $602.78 a year: forks 216/wk x 0.7 x $0.01 x 52 + sauce 360/wk x 0.7 x $0.04 x 52
    expect(screen.getAllByText('Saves $603 a year')).toHaveLength(1)
    expect(screen.queryByText(/Giving forks and sauce only on request could save/)).toBeNull()
    expect(screen.getByRole('heading', { name: 'Takeout' })).toBeTruthy() // laws still there
    expect(screen.getByRole('link', { name: /Read AB 1276/ })).toBeTruthy()
  })

  it("says they're ahead if extras are already on request, with no checklist", () => {
    renderStep({ data: losingData, flow: { ...flow, extrasAuto: 'ifAsked' } })
    expect(
      screen.getByText(
        "At these prices no easy switch saves money yet, and you already give extras only on request, so you're ahead.",
      ),
    ).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Start here' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Your checklist' })).toBeNull()
    // No harder swap saves money either, so no "bigger step".
    expect(screen.queryByRole('heading', { name: "A bigger step, if you're ready" })).toBeNull()
    expect(screen.getByText('We can help you find a switch that works.')).toBeTruthy()
  })
})
