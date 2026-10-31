// The incomplete axe results each lab may leave: findings axe could not decide and that review
// found to be no defect, by lab and rule, with the reason (specs/LABS.md#uic-labs-33---browser-fixture).
// `color-contrast` is never gated: axe leaves it undecided wherever a pseudo element, an overlapping
// layer, an image or a gradient sits behind text, thousands of nodes across the labs, and decides
// every contrast it can measure as a violation.

export const ungatedIncompleteRules: ReadonlySet<string> = new Set(['color-contrast']);

/** An incomplete result any lab may leave: its rule, axe's message and, optionally, the element. */
interface AcceptedPattern {
  rule: string;
  message: RegExp;
  html?: RegExp;
  reason: string;
}

export const acceptedEverywhere: readonly AcceptedPattern[] = [
  {
    rule: 'aria-prohibited-attr',
    message: /^aria-labelledby attribute is not well supported/,
    html: /^<div\b[^>]*\sdata-trigger="/,
    reason:
      "React Aria labels a popover's wrapper by its trigger; the dialog, menu or list inside carries the role and the name.",
  },
  {
    rule: 'aria-valid-attr-value',
    message:
      /^Unable to determine if aria-controls referenced ID exists on the page while using aria-haspopup/,
    reason:
      'A control points at its popup through aria-controls, and the popup mounts only while open.',
  },
];

export const acceptedIncomplete: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'boolean-field': {
    'form-field-multiple-labels':
      "The checkbox has the field's label and React Aria's wrapping label; aria-labelledby names it by the field's.",
  },
  form: {
    'form-field-multiple-labels':
      "The checkbox has the field's label and React Aria's wrapping label; aria-labelledby names it by the field's.",
  },
  'segmented-choice': {
    'label-content-name-mismatch':
      'A segment with a count is named "Open, 3", which holds its visible text "Open 3".',
  },
  'notification-center': {
    'label-content-name-mismatch':
      'A filter segment with a count is named "Unread, 3", which holds its visible text.',
  },
  'tree-compare': {
    'aria-valid-attr-value': 'The lab nests a tree deeper than six levels on purpose.',
  },
  table: {
    'th-has-data-cells': 'The loading, empty and error tables have headers and no data cells.',
  },
  'pivot-table': {
    'th-has-data-cells': 'The empty pivot has headers and no data cells.',
  },
  board: {
    'aria-required-children': "An empty column's virtualized card grid has no rows.",
  },
  'view-switcher': {
    'th-has-data-cells':
      'The sample table heads each group with a row-group header, which axe cannot map to cells.',
  },
  'drag-handle': {
    'th-has-data-cells': 'A table emptied by dragging has headers and no data cells.',
  },
  'file-field': {
    'video-caption': 'The video is a sample attachment preview; captions belong to its content.',
  },
  chat: {
    'aria-prohibited-attr': 'Known defect #704: the key hints name a span without a role.',
  },
  'message-composer': {
    'aria-prohibited-attr': 'Known defect #704: the key hints name a span without a role.',
  },
};
