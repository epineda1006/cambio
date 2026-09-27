// ShareButton.jsx: "Share my plan", with three levels of fallback.
//
//   1. WEB SHARE API (navigator.share): on most phones this opens the
//      system share sheet (WhatsApp, Messages, email...), the natural way
//      to send something to a business partner or family member.
//   2. CLIPBOARD (navigator.clipboard.writeText): where sharing isn't
//      available (most desktop browsers), copy the text and say "Copied".
//   3. MANUAL: if copying is blocked too, show the text in a box so it
//      can be selected and copied by hand.
//
// Both browser APIs are ASYNCHRONOUS: they return a Promise (a value that
// arrives later, e.g. after the person picks an app). "async" / "await"
// lets us write that as ordinary top-to-bottom code, and try/catch handles
// the case where it fails or the person cancels.

import { useState } from 'react'
import { useLanguage } from '../i18n/languageContext.js'

/**
 * Props:
 *   title  a short title for the share sheet
 *   text   the plain text to share (from buildShareText in lib/shareText.js)
 */
export default function ShareButton({ title, text }) {
  const { t } = useLanguage()
  // 'idle' | 'copied' | 'manual': which message to show under the button.
  const [status, setStatus] = useState('idle')

  async function handleClick() {
    setStatus('idle')

    // 1. The phone's share sheet, if this browser has one.
    if (navigator.share) {
      try {
        await navigator.share({ title, text })
        return // shared: the system already showed its own confirmation
      } catch (error) {
        // "AbortError" means the person closed the share sheet on purpose:
        // not a failure, so don't fall back to copying.
        if (error?.name === 'AbortError') return
      }
    }

    // 2. Copy to the clipboard.
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      // 3. Show the text to copy by hand. (navigator.clipboard can be
      //    missing entirely, which also lands here.)
      setStatus('manual')
    }
  }

  return (
    <div className="share">
      <button type="button" className="button" onClick={handleClick}>
        {t('share.button')}
      </button>

      {/* role="status": screen readers announce this message when it
          appears, without moving focus away from the button. */}
      <p className="share-status" role="status">
        {status === 'copied' ? t('share.copied') : ''}
      </p>

      {status === 'manual' && (
        <div className="field">
          <label htmlFor="share-text">{t('share.manual')}</label>
          <textarea
            id="share-text"
            readOnly
            rows={8}
            value={text}
            // Select everything as soon as it's tapped, ready to copy.
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
    </div>
  )
}
