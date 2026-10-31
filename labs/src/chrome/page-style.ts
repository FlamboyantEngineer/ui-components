// The lab page's own layout: the page padding and the state matrix grid. It belongs to the labs,
// not to the reference stylesheet the package ships, so it applies whichever stylesheet is chosen
// and falls back to the text colour where the stylesheet defines no reference tokens.

const pageStyleId = 'ui-lab-page-style';

const pageStyle = `
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
 * Adds the lab page style to the head once, and marks the root so the reference stylesheet draws
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
