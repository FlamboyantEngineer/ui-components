import { render } from '@testing-library/react';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { parseSvgMarkup } from './parse-svg-markup.js';
import { SvgMarkup } from './svg-markup.js';
import { readTimingReferences, scopeTimingList } from './svg-timing.js';

const local = new Set(['9', 'ñ', 'a.b', 'a-b', 'a:b', 'dot']);
const scope = (value: string) => scopeTimingList(value, 'p_', (id) => local.has(id));

/** A drawing whose timing names local numeric and Unicode IDs and IDs the page defines. */
const timedMarkup =
  '<svg><rect id="9" width="4" height="4"/><rect id="ñ" width="4" height="4"><set attributeName="fill" to="red" begin="9.click; ñ.click+1s; 123.click; é.click; 2s" end="é.end; ñ.end" dur="indefinite"/></rect></svg>';

describe('SVG animation timing', () => {
  it('UIC-SVG-MARKUP-1.4 reads the element IDs browsers look up in a timing item', () => {
    expect(readTimingReferences('123.click')).toEqual(['123']);
    expect(readTimingReferences('é.click+1s')).toEqual(['é']);
    expect(readTimingReferences('a\\.b.end')).toEqual(['a.b']);
    // Chromium splits at the first sign; SMIL keeps a `-` in the ID unless an offset follows.
    expect(readTimingReferences('host-status.click')).toEqual(['host-status']);
    expect(readTimingReferences('a\\-b.click')).toEqual(['a-b']);
    expect(readTimingReferences('dot.click-0.5s')).toEqual(['dot']);
    for (const item of ['2s', '1.5s', '-1s', '+ 00:01.5', '01:02:03.25', 'indefinite', 'click']) {
      expect(readTimingReferences(item)).toEqual([]);
    }
    expect(readTimingReferences('click+1.5s')).toEqual([]);
    expect(readTimingReferences('repeat(2)')).toEqual([]);
  });

  it('UIC-SVG-MARKUP-1.4 scopes local numeric, Unicode and punctuated IDs and drops the rest', () => {
    expect(scope('9.click; ñ.click+1s; a:b.end-2s; a\\.b.begin; a\\-b.click')).toBe(
      'p_9.click;p_ñ.click+1s;p_a:b.end-2s;p_a\\.b.begin;p_a\\-b.click',
    );
    expect(scope('123.click; é.click; host-status.click; 1s; click')).toBe('1s;click');
    expect(scope('123.click;é.end')).toBeNull();
    expect(scope(' ; ')).toBeNull();
  });

  it('UIC-SVG-MARKUP-1.4 keeps a drawing timing on its own elements, rendered and hydrated', async () => {
    const tree = parseSvgMarkup(timedMarkup);
    const snapshot = JSON.stringify(tree);
    const { container, unmount } = render(<SvgMarkup markup={timedMarkup} />);
    const [nine, own] = [...container.querySelectorAll('rect')].map((rect) => rect.id);
    const set = container.querySelector('set');
    expect(set).toHaveAttribute('begin', `${nine}.click;${own}.click+1s;2s`);
    expect(set).toHaveAttribute('end', `${own}.end`);
    unmount();

    const host = document.createElement('div');
    host.innerHTML = renderToString(<SvgMarkup markup={timedMarkup} />);
    document.body.append(host);
    const served = host.innerHTML;
    const errors = vi.spyOn(console, 'error');
    const root = await act(async () => hydrateRoot(host, <SvgMarkup markup={timedMarkup} />));
    expect(host.innerHTML).toBe(served);
    expect(errors).not.toHaveBeenCalled();
    expect(host.querySelector('set')?.getAttribute('begin')).toMatch(
      /^\w+_9\.click;\w+_ñ\.click\+1s;2s$/,
    );
    act(() => root.unmount());
    host.remove();
    expect(JSON.stringify(tree)).toBe(snapshot);
  });
});
