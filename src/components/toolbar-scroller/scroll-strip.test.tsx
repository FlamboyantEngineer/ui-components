import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createHooks } from '../../core/hooks.js';
import { isOverflowing } from '../../utils/is-overflowing.js';
import { ScrollStrip } from './scroll-strip.js';

const hooks = createHooks('demo-strip', ['fade', 'scroll-button']);

function parts(container: HTMLElement) {
  return Array.from(container.children, (child) =>
    [
      child.className.split(' ').at(-1),
      child.getAttribute('data-edge'),
      child.hasAttribute('hidden'),
    ].join(' '),
  );
}

describe('ScrollStrip', () => {
  it('UIC-SCROLL-STRIP-2.1 draws the fades and scroll buttons asked for around one strip', async () => {
    const user = userEvent.setup();
    const onPage = vi.fn();
    const strip = <div className="strip">Tools</div>;
    const draw = (props: { hasButtons: boolean; withFades: boolean }) => (
      <ScrollStrip
        hooks={hooks}
        fadeHooks={props.withFades ? hooks : undefined}
        edges={{ start: false, end: true }}
        onPage={onPage}
        hasButtons={props.hasButtons}
      >
        {strip}
      </ScrollStrip>
    );
    const { container, rerender } = render(draw({ hasButtons: true, withFades: true }));
    const stripElement = container.querySelector('.strip');
    expect(parts(container)).toEqual([
      'ui-demo-strip__fade start true',
      'ui-demo-strip__scroll-button start true',
      'strip  false',
      'ui-demo-strip__fade end false',
      'ui-demo-strip__scroll-button end false',
    ]);
    expect(container.querySelector('.ui-demo-strip__fade')).toHaveAttribute('aria-hidden', 'true');
    const forward = screen.getByRole('button', { name: 'Scroll forward' });
    expect(forward).toHaveAttribute('tabindex', '-1');
    await user.click(forward);
    expect(onPage).toHaveBeenCalledWith('end');

    rerender(draw({ hasButtons: false, withFades: false }));
    expect(parts(container)).toEqual(['strip  false']);
    expect(container.querySelector('.strip')).toBe(stripElement);
    rerender(draw({ hasButtons: true, withFades: false }));
    expect(container.querySelector('.strip')).toBe(stripElement);
    expect(container.querySelectorAll('.ui-demo-strip__scroll-button')).toHaveLength(2);
  });

  it('UIC-SCROLL-STRIP-2.1 measures overflow past one pixel along an axis', () => {
    const element = document.createElement('div');
    Object.defineProperties(element, {
      scrollWidth: { value: 102 },
      clientWidth: { value: 100 },
      scrollHeight: { value: 51 },
      clientHeight: { value: 50 },
    });
    expect(isOverflowing(element, 'horizontal')).toBe(true);
    expect(isOverflowing(element, 'vertical')).toBe(false);
  });
});
