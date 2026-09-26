// shareText.js: the short plain-text summary behind "Share my plan".
//
// A pure function: results + language in, text out. It uses translate() and
// createFormatters() directly (not the useLanguage hook), so it works
// outside React and is easy to test in both languages.
//
// While any number is still PLACEHOLDER, the text ALWAYS ends with the
// "prices are examples" line: a shared message travels further than the
// screen, so it must never make invented numbers look real.

import { createFormatters, translate } from '../i18n/languageContext.js'

/**
 * @param results         what buildResults() returns (lib/results.js)
 * @param language        'en' or 'es'
 * @param hasPlaceholder  true while prices or ratios are still PLACEHOLDER
 * @returns a few short lines of text, joined with line breaks
 */
export function buildShareText(results, language, hasPlaceholder) {
  const t = (key, vars) => translate(language, key, vars)
  const { formatMoney, formatNumber } = createFormatters(language)

  const lines = [t('share.title')]

  if (results.totalAnnualSavings > 0) {
    lines.push(
      t('share.intro', {
        year: formatMoney(results.totalAnnualSavings),
        month: formatMoney(results.totalMonthlySavings),
      }),
    )
    if (results.totalPounds > 0) {
      lines.push(t('share.pounds', { pounds: formatNumber(results.totalPounds) }))
    }
  } else {
    lines.push(t('results.noSavings'))
  }

  // One line per item that has something to swap.
  for (const item of results.items) {
    if (!item.best) continue
    const itemName = t(`items.${item.itemId}`)
    if (item.bestSavesMoney) {
      lines.push(
        t('share.itemLine', {
          item: itemName,
          swap: t(`swaps.${item.best.swapId}`),
          amount: formatMoney(item.best.annualSavings),
        }),
      )
    } else {
      lines.push(t('share.itemNoSaving', { item: itemName }))
    }
  }

  if (hasPlaceholder) lines.push(t('results.placeholder'))

  return lines.join('\n')
}
