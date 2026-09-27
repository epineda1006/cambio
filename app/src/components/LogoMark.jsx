// LogoMark.jsx: Cambio's provisional "plate leaf" mark: a plate (circle)
// with a leaf cut out of it, and a green vein down the leaf.
//
// HOW THE CUT-OUT WORKS (SVG masks)
// A <mask> is a stencil: white parts of the mask let the shape show, black
// parts hide it. Our mask is white everywhere except a thin ring (the plate
// rim) and the leaf shape, so those two are "cut out" of the solid circle.
//
// The plate uses currentColor, so it takes the text color of wherever it's
// placed (white on the black header). public/favicon.svg is the same drawing
// with fixed colors, because a browser tab icon can't inherit a text color.
//
// useId() gives a unique id for the mask. Ids must be unique on a page, and
// this keeps them unique even if the logo appears more than once.

import { useId } from 'react'

export default function LogoMark() {
  const maskId = `cambio-plate-${useId()}`

  return (
    // aria-hidden: decorative, since the "Cambio" wordmark next to it
    // already names the app for screen readers.
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <rect width="64" height="64" fill="#fff" />
          <circle cx="32" cy="32" r="21" fill="none" stroke="#000" strokeWidth="2.2" />
          <path d="M32 17 C43 21 43 39 32 45 C21 39 21 21 32 17 Z" fill="#000" />
        </mask>
      </defs>
      <circle cx="32" cy="32" r="29" fill="currentColor" mask={`url(#${maskId})`} />
      <path d="M32 22 V40" stroke="#5fd39a" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
