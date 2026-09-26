// SavingsFlow.jsx: the Savings tab, a 3-step flow.
//
//   Step 1  Your business           (StepBusiness.jsx)
//   Step 2  What you use each week  (StepUsage.jsx)
//   Step 3  Your savings            (StepResults.jsx)
//
// Which step is showing, and every answer, live in App (the `flow` prop),
// so switching steps or tabs never loses anything. This component just
// picks the right step and handles moving between them.

import { useEffect, useRef } from 'react'
import { useLanguage } from '../../i18n/languageContext.js'
import StepBusiness from './StepBusiness.jsx'
import StepResults from './StepResults.jsx'
import StepUsage from './StepUsage.jsx'

const TOTAL_STEPS = 3

/**
 * Props:
 *   flow      the flow state (see lib/flow.js)
 *   onChange  call with the fields that changed, e.g. { step: 2 }
 */
export default function SavingsFlow({ flow, onChange }) {
  const { t, formatNumber } = useLanguage()
  const containerRef = useRef(null)
  const isFirstRender = useRef(true)

  // FOCUS MANAGEMENT: when the step changes, the whole screen changes but
  // the page address doesn't, so a screen reader wouldn't notice. Moving
  // focus to the new heading makes it read the new step's title, and
  // scrolling to the top shows the start of the new step.
  // (Skipped on first render, so opening the tab doesn't jump focus.)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    window.scrollTo(0, 0)
    containerRef.current?.querySelector('h1')?.focus()
  }, [flow.step])

  const goTo = (step) => onChange({ step })

  return (
    <section ref={containerRef}>
      <p className="step-indicator">
        {t('flow.stepOf', { n: formatNumber(flow.step), total: formatNumber(TOTAL_STEPS) })}
      </p>

      {flow.step === 1 && (
        <StepBusiness flow={flow} onChange={onChange} onContinue={() => goTo(2)} />
      )}
      {flow.step === 2 && (
        <StepUsage
          flow={flow}
          onChange={onChange}
          onBack={() => goTo(1)}
          onContinue={() => goTo(3)}
        />
      )}
      {flow.step === 3 && <StepResults onBack={() => goTo(2)} />}
    </section>
  )
}
