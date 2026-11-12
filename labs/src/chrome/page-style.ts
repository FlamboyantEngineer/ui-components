// The lab page's own layout: the page padding and the state matrix grid. It belongs to the labs,
// not to the reference stylesheet the package ships, so it applies whichever stylesheet is chosen
// and falls back to the text colour where the stylesheet defines no reference tokens.

const pageStyleId = 'ui-lab-page-style';

// The Latin subsets of Geist and Geist Mono, which the reference stylesheet names but cannot load.
const fontSubsets = {
  latin:
    'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  'latin-ext':
    'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
};

/** `@font-face` rules for the fonts `scripts/build-labs.mjs` copies to `build/vendor/fonts/`. */
function fontFaces(): string {
  const families = { Geist: 'geist', 'Geist Mono': 'geist-mono' };
  return Object.entries(families)
    .flatMap(([family, file]) =>
      Object.entries(fontSubsets).flatMap(([subset, range]) =>
        ['normal', 'italic'].map(
          (style) => `@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: 100 900;
  font-display: swap;
  src: url('build/vendor/fonts/${file}-${subset}-wght-${style}.woff2') format('woff2');
  unicode-range: ${range};
}`,
        ),
      ),
    )
    .join('\n');
}

const pageStyle = `
${fontFaces()}
body {
  margin: 0;
}
#lab-root,
#lab-index {
  padding: 16px 24px 48px;
}
#lab-root table[data-lab-matrix] {
  border-collapse: collapse;
}
#lab-root table[data-lab-matrix] > * > tr > :is(th, td) {
  border: 1px solid var(--ref-border, color-mix(in srgb, currentColor 25%, transparent));
  text-align: start;
  vertical-align: middle;
}
#lab-root table[data-lab-matrix] > * > tr > th {
  color: var(--ref-muted, inherit);
  font-weight: 500;
}
/* Size samples compare control boxes without the field's reserved feedback row. */
[data-lab-control-sample] .ui-field__message:empty {
  min-height: 0;
  margin-top: 0;
}
`;

/**
 * Adds the lab page style, with the lab fonts, to the head once, and marks the root so the reference stylesheet draws
 * its document base (type, text colour, canvas and colour scheme) on the lab page.
 */
export function applyPageStyle(doc: Document = document): void {
  doc.documentElement.toggleAttribute('data-reference-document', true);
  if (doc.getElementById(pageStyleId)) return;
  const style = doc.createElement('style');
  style.id = pageStyleId;
  style.textContent = pageStyle;
  doc.head.prepend(style);
}
