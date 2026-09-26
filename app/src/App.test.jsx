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

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import LanguageProvider from './i18n/LanguageProvider.jsx'

function renderApp() {
  return render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
  )
}

// Answer Step 1: 120 customers a day, open 6 days, half and half.
function answerStepOne() {
  fireEvent.change(screen.getByLabelText('How many customers a day?'), {
    target: { value: '120' },
  })
  fireEvent.click(screen.getByLabelText('6'))
  fireEvent.click(screen.getByLabelText(/Half and half/))
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
    expect(screen.getByText('Step 1 of 3')).toBeTruthy()
    expect(screen.getByLabelText('How many customers a day?').value).toBe('')
    for (const radio of screen.getAllByRole('radio')) expect(radio.checked).toBe(false)
  })

  it('lists every missing answer when Continue is pressed too early', () => {
    renderApp()
    fireEvent.click(continueButton())

    const summary = screen.getByRole('alert')
    expect(summary.textContent).toContain('There is a problem')
    expect(summary.textContent).toContain('Enter how many customers you have a day')
    expect(summary.textContent).toContain('Select how many days a week you are open')
    expect(summary.textContent).toContain('Select whether most orders are for here or to go')
    expect(screen.getByText('Step 1 of 3')).toBeTruthy() // didn't move on
  })

  it('moves to step 2 once every answer is valid', () => {
    renderApp()
    answerStepOne()
    fireEvent.click(continueButton())
    expect(screen.getByText('Step 2 of 3')).toBeTruthy()
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
    expect(screen.queryByText('Step 2 of 3')).toBeNull() // the flow really is gone
    fireEvent.click(screen.getByRole('button', { name: 'Savings' }))
    expect(screen.getByText('Step 2 of 3')).toBeTruthy()

    // Back to step 1: the answers are still there.
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText('How many customers a day?').value).toBe('120')
    expect(screen.getByLabelText('6').checked).toBe(true)
    expect(screen.getByLabelText(/Half and half/).checked).toBe(true)
  })
})
