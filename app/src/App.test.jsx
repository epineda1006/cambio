// @vitest-environment jsdom
//
// The comment above tells Vitest to run this file in "jsdom": a fake browser
// (a pretend page, buttons, and inputs) that lives inside Node. Our other
// tests only check plain functions; this one renders the whole app and
// clicks around it, the way a person would.
//
// Testing Library vocabulary:
//   render(...)            draw a component into the fake page
//   screen.getByRole(...)  find an element the way a person would ("the
//                          button called Map"), not by CSS class
//   fireEvent.change/click simulate typing and tapping

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import LanguageProvider from './i18n/LanguageProvider.jsx'
import { itemProfilesById } from './lib/loadItems.js'

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

// Answer Step 1: 120 customers a day, open 6 days, half and half, dishwasher.
function answerStepOne() {
  fireEvent.change(screen.getByLabelText('How many customers a day?'), {
    target: { value: '120' },
  })
  fireEvent.click(screen.getByLabelText('6'))
  fireEvent.click(screen.getByLabelText(/Half and half/))
  fireEvent.click(screen.getByLabelText('Dishwasher'))
}

const continueButton = () => screen.getByRole('button', { name: 'Continue' })

beforeEach(() => {
  window.localStorage.clear() // start every test in English, nothing saved
  // jsdom doesn't implement scrolling; replace it with a do-nothing function.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  // Same for scrollIntoView (used by the error summary links).
  Element.prototype.scrollIntoView = () => {}
})

afterEach(() => {
  cleanup() // remove the rendered app so tests don't affect each other
  vi.restoreAllMocks()
})

describe('Savings flow, step 1', () => {
  it('starts on step 1 with nothing preselected', () => {
    renderApp()
    expect(screen.getByText('Step 1 of 4')).toBeTruthy()
    expect(screen.getByLabelText('How many customers a day?').value).toBe('')
    for (const radio of screen.getAllByRole('radio')) expect(radio.checked).toBe(false)
  })

  it('offers every day count from 1 to 7', () => {
    renderApp()
    for (let days = 1; days <= 7; days++) {
      expect(screen.getByLabelText(String(days)).getAttribute('name')).toBe('days')
    }
  })

  it('lists every missing answer when Continue is pressed too early', () => {
    renderApp()
    fireEvent.click(continueButton())

    const summary = screen.getByRole('alert')
    expect(summary.textContent).toContain('There is a problem')
    expect(summary.textContent).toContain('Enter how many customers you have a day')
    expect(summary.textContent).toContain('Select how many days a week you are open')
    expect(summary.textContent).toContain('Select whether most orders are for here or to go')
    expect(summary.textContent).toContain('Select how you wash dishes')
    expect(screen.getByText('Step 1 of 4')).toBeTruthy() // didn't move on
  })

  it('moves to step 2 once every answer is valid', () => {
    renderApp()
    answerStepOne()
    fireEvent.click(continueButton())
    expect(screen.getByText('Step 2 of 4')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('What you use each week')
  })
})

describe('switching tabs and steps', () => {
  it('keeps the step and every answer', () => {
    renderApp()
    answerStepOne()
    fireEvent.click(continueButton())

    // Go to the Map tab and back: still on step 2.
    fireEvent.click(screen.getByRole('button', { name: 'Map' }))
    expect(screen.queryByText('Step 2 of 4')).toBeNull() // the flow really is gone
    fireEvent.click(screen.getByRole('button', { name: 'Savings' }))
    expect(screen.getByText('Step 2 of 4')).toBeTruthy()

    // Back to step 1: the answers are still there.
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText('How many customers a day?').value).toBe('120')
    expect(screen.getByLabelText('6').checked).toBe(true)
    expect(screen.getByLabelText(/Half and half/).checked).toBe(true)
  })
})

describe('Savings flow, step 2', () => {
  // Our estimate for one item, from the real items.csv ratio.
  const estimate = (itemId, customers) =>
    Math.round(customers * 6 * itemProfilesById[itemId].perCustomer).toLocaleString('en-US')

  // The summary-list row for one item, found by its name.
  const row = (name) => screen.getByText(name, { selector: 'dt' }).parentElement

  function goToStepTwo() {
    renderApp()
    answerStepOne()
    fireEvent.click(continueButton())
  }

  it('shows an estimate for every item', () => {
    goToStepTwo()
    expect(row('Plastic cups').textContent).toContain(`${estimate('plastic_cups', 120)} a week`)
    expect(row('To-go boxes').textContent).toContain(`${estimate('takeout_clamshells', 120)} a week`)
    expect(row('Plastic forks').textContent).toContain('Estimated')
    expect(screen.getByText(/Estimated from 120 customers a day, 6 days a week/)).toBeTruthy()
  })

  it("keeps the owner's own number, even after customers per day changes", () => {
    goToStepTwo()
    fireEvent.click(screen.getByRole('button', { name: 'Change Plastic cups' }))
    fireEvent.change(screen.getByLabelText('Plastic cups per week'), { target: { value: '400' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(row('Plastic cups').textContent).toContain('400 a week')
    expect(row('Plastic cups').textContent).toContain('You entered')

    // Back to step 1, change customers to 100, continue again.
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    fireEvent.change(screen.getByLabelText('How many customers a day?'), { target: { value: '100' } })
    fireEvent.click(continueButton())
    expect(row('Plastic cups').textContent).toContain('400 a week') // kept
    expect(row('To-go boxes').textContent).toContain(`${estimate('takeout_clamshells', 100)} a week`) // updated

    // "Use estimate" goes back to our number.
    fireEvent.click(screen.getByRole('button', { name: /Use estimate .* Plastic cups/ }))
    expect(row('Plastic cups').textContent).toContain(`${estimate('plastic_cups', 100)} a week`)
  })

  it('refuses a number that is not a whole number', () => {
    goToStepTwo()
    fireEvent.click(screen.getByRole('button', { name: 'Change Plastic forks' }))
    fireEvent.change(screen.getByLabelText('Plastic forks per week'), { target: { value: 'many' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Enter a whole number, like 400')).toBeTruthy()
    expect(screen.getByLabelText('Plastic forks per week')).toBeTruthy() // still editing
    // Sighted people see the short label; screen readers get the full name above.
    expect(screen.getByText('Per week', { selector: 'label' })).toBeTruthy()
  })

  it('saves an open edit when "See my savings" is pressed', () => {
    goToStepTwo()
    fireEvent.click(screen.getByRole('button', { name: 'Change Plastic cups' }))
    fireEvent.change(screen.getByLabelText('Plastic cups per week'), { target: { value: '250' } })
    fireEvent.click(screen.getByRole('button', { name: 'See my savings' }))
    expect(screen.getByText('Step 3 of 4')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(row('Plastic cups').textContent).toContain('250 a week')
  })
})

describe('Savings flow, step 3', () => {
  function goToResults() {
    renderApp()
    answerStepOne()
    fireEvent.click(continueButton())
    fireEvent.click(screen.getByRole('button', { name: 'See my savings' }))
  }

  it('shows the yearly and monthly savings in the headline panel', () => {
    goToResults()
    expect(screen.getByText('Step 3 of 4')).toBeTruthy()
    expect(screen.getByText('You could save')).toBeTruthy()
    expect(screen.getByText(/^\$[\d,.]+ a year$/)).toBeTruthy()
    expect(screen.getByText(/^\(\$[\d,.]+ a month\)$/)).toBeTruthy()
  })

  it('labels each money-saving best swap BEST and shows pounds and payback', () => {
    goToResults()
    expect(screen.getAllByText('BEST').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/lb of plastic avoided a year/).length).toBe(3)
    expect(screen.getAllByText(/Pays for itself in|Never pays for itself/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Takeout \(50%\): compostable options coming soon/)).toBeTruthy()
  })

  it('opens and closes the other options', () => {
    goToResults()
    const toggle = screen.getAllByRole('button', { name: /Compare 1 other option/ })[0]
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById(toggle.getAttribute('aria-controls'))).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Hide other options' }))
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('shows every swap in "How we calculated this"', () => {
    goToResults()
    expect(screen.getByText('How we calculated this')).toBeTruthy()
    expect(screen.getAllByText('Yearly savings').length).toBe(5) // one per swap in swaps.csv
  })

  it('continues to step 4, "Your first switch", and back', () => {
    goToResults()
    fireEvent.click(screen.getByRole('button', { name: 'See my first switch' }))
    expect(screen.getByText('Step 4 of 4')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Your first switch')
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Step 3 of 4')).toBeTruthy()
  })

  it('shows lower savings for hand washing than for a dishwasher', () => {
    // The panel's yearly amount, as a number.
    const yearly = () => Number(screen.getByText(/^\$[\d,.]+ a year$/).textContent.replace(/[^\d.]/g, ''))
    goToResults()
    const machine = yearly()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    fireEvent.click(screen.getByLabelText('By hand'))
    fireEvent.click(continueButton())
    fireEvent.click(screen.getByRole('button', { name: 'See my savings' }))
    expect(yearly()).toBeLessThan(machine)
  })

  it('starts over with every answer cleared', () => {
    goToResults()
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }))
    expect(screen.getByText('Step 1 of 4')).toBeTruthy()
    expect(screen.getByLabelText('How many customers a day?').value).toBe('')
    for (const radio of screen.getAllByRole('radio')) expect(radio.checked).toBe(false)
  })
})

describe('Share my plan', () => {
  // navigator.share and navigator.clipboard are browser features that jsdom
  // doesn't have, so each test installs a pretend version ("mock").
  function setNavigator(name, value) {
    Object.defineProperty(navigator, name, { value, configurable: true })
  }

  afterEach(() => {
    setNavigator('share', undefined)
    setNavigator('clipboard', undefined)
  })

  function goToResults() {
    renderApp()
    answerStepOne()
    fireEvent.click(continueButton())
    fireEvent.click(screen.getByRole('button', { name: 'See my savings' }))
  }

  it("opens the phone's share sheet with the plan text", async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setNavigator('share', share)
    goToResults()
    fireEvent.click(screen.getByRole('button', { name: 'Share my plan' }))
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1))
    const { title, text } = share.mock.calls[0][0]
    expect(title).toBe('My Cambio plan')
    expect(text).toMatch(/^My Cambio plan\nI could save \$/)
    expect(text).toContain('Prices are examples, not real quotes.')
  })

  it('copies the text when sharing is not available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNavigator('clipboard', { writeText })
    goToResults()
    fireEvent.click(screen.getByRole('button', { name: 'Share my plan' }))
    expect(await screen.findByText('Copied. You can paste it into a message.')).toBeTruthy()
    expect(writeText.mock.calls[0][0]).toContain('My Cambio plan')
  })

  it('does nothing more when the person closes the share sheet', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' })
    setNavigator('share', vi.fn().mockRejectedValue(abort))
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNavigator('clipboard', { writeText })
    goToResults()
    fireEvent.click(screen.getByRole('button', { name: 'Share my plan' }))
    await waitFor(() => expect(navigator.share).toHaveBeenCalled())
    expect(writeText).not.toHaveBeenCalled()
  })

  it('shows the text to copy by hand when copying is blocked', async () => {
    setNavigator('clipboard', { writeText: vi.fn().mockRejectedValue(new Error('blocked')) })
    goToResults()
    fireEvent.click(screen.getByRole('button', { name: 'Share my plan' }))
    const box = await screen.findByLabelText('Copy this text to share your plan:')
    expect(box.value).toContain('My Cambio plan')
  })
})
