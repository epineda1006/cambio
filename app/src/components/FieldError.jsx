// FieldError.jsx: the red message shown right above a field that needs
// fixing. The hidden "Error:" prefix tells screen-reader users what kind of
// message this is, since they can't see the red color.

import { useLanguage } from '../i18n/languageContext.js'

/**
 * Props:
 *   id     used by the field's aria-describedby, so screen readers read the
 *          message when the field is focused
 *   error  one { key, vars } from validateBusiness(), or undefined for none
 */
export default function FieldError({ id, error }) {
  const { t } = useLanguage()
  if (!error) return null

  return (
    <p className="error-message" id={id}>
      <span className="visually-hidden">{t('errors.prefix')} </span>
      {t(error.key, error.vars)}
    </p>
  )
}
