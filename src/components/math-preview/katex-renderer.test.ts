import { describe, expect, it } from 'vitest';
import { renderKatexMath as typeset } from './katex-renderer.js';

describe('renderKatexMath', () => {
  it('UIC-MATH-PREVIEW-1.4 typesets to MathML only', async () => {
    const result = await typeset('\\frac{a}{b}', { displayMode: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mathml).toContain('<mfrac>');
    expect(result.mathml).toContain('display="block"');
    expect(result.mathml).not.toContain('katex-html');
  });

  it('UIC-MATH-PREVIEW-1.4 refuses active commands and bounds expansion', async () => {
    for (const source of [
      '\\href{javascript:alert(1)}{x}',
      '\\url{https://a.example}',
      '\\htmlClass{c}{x}',
    ]) {
      const result = await typeset(source, { displayMode: false });
      expect(result.ok && result.mathml).not.toMatch(/\shref=|\sclass="c"|<a\s/);
      // A refused command shows in the text colour, not a fixed red.
      expect(result.ok && result.mathml).not.toContain('#cc0000');
    }
    expect(await typeset('\\def\\a{\\a}\\a', { displayMode: false })).toEqual({
      ok: false,
      message: expect.stringContaining('Too many expansions') as string,
    });
    expect(await typeset('\\frac{1', { displayMode: false })).toMatchObject({ ok: false });
  });
});
