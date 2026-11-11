// Typesets LaTeX to a sanitized MathML element without React, for hosts that draw math themselves
// (specs/MATH-PREVIEW.md, UIC-MATH-PREVIEW-3.2).

import { renderKatexMath } from './katex-renderer.js';
import type { MathRenderer } from './math-render.js';
import { sanitizeMathMarkup } from './math-sanitize.js';

export interface MathElementOptions {
  /** Display math stands on its own line; inline math sits in a line of text. */
  displayMode: boolean;
  /** Typesets the source to MathML. Defaults to `renderKatexMath`. */
  renderer?: MathRenderer | undefined;
  /** The document the element is created in. */
  ownerDocument: Document;
}

/** A typeset element, or why the source did not typeset. */
export type MathElementResult = { ok: true; element: Element } | { ok: false; message: string };

/** The message when a renderer's markup holds no math the allow-list keeps. */
const noMathMessage = 'The renderer returned no MathML.';

/**
 * Typesets `source` with `renderer` and returns its `<math>` element, built in `ownerDocument`
 * through the preview's allow-list. Never throws: invalid source, a renderer that throws or
 * rejects, and a renderer that cannot load (KaTeX not installed) all answer `{ ok: false }`.
 */
export async function renderMathElement(
  source: string,
  { displayMode, renderer = renderKatexMath, ownerDocument }: MathElementOptions,
): Promise<MathElementResult> {
  try {
    const answer = await renderer(source, { displayMode });
    if (!answer.ok) return answer;
    const element = sanitizeMathMarkup(answer.mathml, ownerDocument);
    return element ? { ok: true, element } : { ok: false, message: noMathMessage };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
