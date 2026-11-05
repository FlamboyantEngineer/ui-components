// The default renderer: KaTeX, loaded on first use, typesetting to MathML only. Untrusted source
// gets no links, styles or HTML from `\href`, `\url`, `\htmlClass` and the like (`trust: false`):
// such a command shows as its source in the text colour. Sizes and macro expansion are bounded so a
// short source cannot grow without end.

import type { MathRender, MathRenderOptions } from './math-render.js';

/** The largest size, in ems, a source may set with commands such as `\rule` or `\kern`. */
const maxSize = 50;
/** How many macro expansions one source may make. */
const maxExpand = 500;

/** Typesets LaTeX to MathML with KaTeX, an optional peer loaded the first time it is needed. */
export async function renderKatexMath(
  source: string,
  { displayMode }: MathRenderOptions,
): Promise<MathRender> {
  const { default: katex } = await import('katex');
  try {
    const mathml = katex.renderToString(source, {
      displayMode,
      output: 'mathml',
      throwOnError: true,
      trust: false,
      // A refused command shows as its source in the text colour, not KaTeX's fixed red.
      errorColor: 'currentColor',
      strict: 'ignore',
      maxSize,
      maxExpand,
    });
    return { ok: true, mathml };
  } catch (error) {
    if (error instanceof katex.ParseError) return { ok: false, message: error.rawMessage };
    throw error;
  }
}
