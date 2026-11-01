import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShadowHost, inShadow } from '../../../test/shadow-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import { getCompletionOptionId } from './completion-option-id.js';
import { useActiveCompletion } from './use-active-completion.js';

function Harness({ activeKey, outer }: { activeKey: string; outer: boolean }) {
  const anchorRef = useRef<HTMLInputElement>(null);
  useActiveCompletion('cities', activeKey, { isOpen: true, anchorRef });
  return (
    <>
      <input ref={anchorRef} aria-label="City" />
      <div className="ui-completion-list" style={{ overflowY: outer ? 'auto' : 'hidden' }}>
        <div
          id="cities"
          role="listbox"
          aria-label="Cities"
          style={{ overflowY: outer ? 'visible' : 'auto' }}
        >
          <div
            id={getCompletionOptionId('cities', 'first')}
            role="option"
            aria-selected={activeKey === 'first'}
          >
            Amsterdam
          </div>
          <div
            id={getCompletionOptionId('cities', 'last')}
            role="option"
            aria-selected={activeKey === 'last'}
          >
            Zurich
          </div>
        </div>
      </div>
    </>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('useActiveCompletion', () => {
  it.each(['listbox', 'popover'] as const)(
    'UIC-COMPLETION-LIST-1.2 scrolls only the latest option within its %s scroll owner',
    (owner) => {
      const outer = owner === 'popover';
      const frames: FrameRequestCallback[] = [];
      vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        frames.push(callback);
        return 0;
      });
      const cancel = vi.fn();
      vi.stubGlobal('cancelAnimationFrame', cancel);
      const { rerender } = render(<Harness activeKey="first" outer={outer} />);
      const list = screen.getByRole('listbox', { name: 'Cities' });
      const container = outer ? requireDefined(list.parentElement) : list;
      Object.defineProperties(container, {
        clientHeight: { value: 100 },
        scrollHeight: { value: 400 },
      });
      container.scrollTop = 50;
      container.getBoundingClientRect = () => ({ top: 0, bottom: 100 }) as DOMRect;
      const first = screen.getByRole('option', { name: 'Amsterdam' });
      const last = screen.getByRole('option', { name: 'Zurich' });
      first.getBoundingClientRect = () =>
        ({ top: -container.scrollTop, bottom: 20 - container.scrollTop, height: 20 }) as DOMRect;
      last.getBoundingClientRect = () =>
        ({
          top: 280 - container.scrollTop,
          bottom: 300 - container.scrollTop,
          height: 20,
        }) as DOMRect;
      rerender(<Harness activeKey="last" outer={outer} />);
      act(() => frames[0]?.(0));
      expect(container.scrollTop).toBe(50);
      expect(cancel).toHaveBeenCalledWith(0);
      act(() => frames[1]?.(0));
      expect(container.scrollTop).toBe(200);
      expect(last.getBoundingClientRect().bottom).toBe(100);
      expect(document.documentElement.scrollTop).toBe(0);
    },
  );
  it('UIC-COMPLETION-LIST-1.2 finds its list in its own shadow root, not a same-id list outside', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const tree = (activeKey: string) => (
      <>
        <div id="cities" role="listbox" aria-label="Decoy" />
        <ShadowHost name="completions">
          <Harness activeKey={activeKey} outer={false} />
        </ShadowHost>
      </>
    );
    const { rerender } = render(tree('first'));
    const list = inShadow('completions').getByRole('listbox', { name: 'Cities' });
    Object.defineProperties(list, { clientHeight: { value: 100 }, scrollHeight: { value: 400 } });
    list.getBoundingClientRect = () => ({ top: 0, bottom: 100 }) as DOMRect;
    const last = inShadow('completions').getByRole('option', { name: 'Zurich' });
    last.getBoundingClientRect = () =>
      ({ top: 280 - list.scrollTop, bottom: 300 - list.scrollTop, height: 20 }) as DOMRect;
    rerender(tree('last'));
    act(() => frames.at(-1)?.(0));
    expect(list.scrollTop).toBe(200);
  });
});
