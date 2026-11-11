// The lab bar's own stylesheet, adopted by the shadow root `mountLabBar` draws it in, so neither the
// stylesheet a lab page loads nor the lab itself changes how the bar looks. It uses system colours
// only, so it reads in either colour scheme with no tokens of its own.

/**
 * The bar stays above the lab's content as the page scrolls (in-page z-indexes reach 4), and below
 * every overlay layer, whose default scale starts at the backdrop's 100, so a full-screen modal,
 * drawer or menu covers it rather than sitting under it.
 */
const barZIndex = 99;

export const labBarStyles = `
:host {
  all: initial;
  display: block;
  position: sticky;
  top: 0;
  z-index: ${barZIndex};
  color-scheme: light dark;
  font: 13px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif;
}
:host([data-lab-scheme='light']) { color-scheme: light; }
:host([data-lab-scheme='dark']) { color-scheme: dark; }
[data-lab-part='bar'] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 8px 16px;
  background: Canvas;
  color: CanvasText;
  border-bottom: 1px solid GrayText;
}
[data-lab-part='title'] { display: flex; align-items: baseline; gap: 12px; min-width: 0; }
[data-lab-part='name'] { font-weight: 600; }
[data-lab-part='back'] { color: LinkText; }
[data-lab-part='controls'] { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
label, [data-lab-part='group-label'] { color: CanvasText; }
select, input, button {
  font: inherit;
  color: FieldText;
  background: Field;
  border: 1px solid GrayText;
  border-radius: 4px;
  padding: 2px 6px;
  min-height: 24px;
  box-sizing: border-box;
}
button { color: ButtonText; background: ButtonFace; cursor: pointer; }
input { width: 14ch; }
input[inputmode='url'] { width: 28ch; }
input[data-lab-part='attribute'] { width: 12ch; }
:focus-visible { outline: 2px solid Highlight; outline-offset: 1px; }
.ui-segmented-choice {
  display: inline-flex;
  border: 1px solid GrayText;
  border-radius: 4px;
  overflow: hidden;
}
.ui-segmented-choice__segment {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  border-radius: 0;
  background: Field;
  color: FieldText;
}
.ui-segmented-choice__segment + .ui-segmented-choice__segment { border-inline-start: 1px solid GrayText; }
.ui-segmented-choice__segment[data-selected] { background: Highlight; color: HighlightText; }
.ui-segmented-choice__segment[data-focus-visible] { outline: 2px solid Highlight; outline-offset: -4px; }
.ui-segmented-choice__segment[data-selected][data-focus-visible] { outline-color: HighlightText; }
.ui-segmented-choice__indicator { display: none; }
.ui-icon { display: inline-flex; width: 14px; height: 14px; flex: none; }
.ui-icon svg { width: 100%; height: 100%; }
@media (max-width: 640px) {
  [data-lab-part='bar'] { padding: 8px; }
  input[inputmode='url'] { width: 100%; }
}
`;
