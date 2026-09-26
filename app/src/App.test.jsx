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

beforeEach(() => {
  window.localStorage.clear() // start every test in English, nothing saved
  // jsdom doesn't implement scrolling; replace it with a do-nothing function.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

afterEach(() => {
  cleanup() // remove the rendered app so tests don't affect each other
  vi.restoreAllMocks()
})

describe('switching tabs', () => {
  it('keeps what the owner typed on the Savings screen', () => {
    const { container } = renderApp()
    const cupsQty = () => container.querySelector('#qty-plastic_cups')
    const cupsDineIn = () => container.querySelector('#dinein-plastic_cups')
    const daysOpen = () => container.querySelector('#days-open')

    fireEvent.change(cupsQty(), { target: { value: '700' } })
    fireEvent.change(cupsDineIn(), { target: { value: '80' } })
    fireEvent.change(daysOpen(), { target: { value: '5' } })

    // Go to the Map tab and back.
    fireEvent.click(screen.getByRole('button', { name: 'Map' }))
    expect(cupsQty()).toBeNull() // the Savings screen really is gone
    fireEvent.click(screen.getByRole('button', { name: 'Savings' }))

    // Everything typed is still there...
    expect(cupsQty().value).toBe('700')
    expect(cupsDineIn().value).toBe('80')
    expect(daysOpen().value).toBe('5')
    // ...and so are the results computed from it.
    expect(screen.getAllByText(/Saves \$[\d,.]+ per year/).length).toBeGreaterThan(0)
  })
})
