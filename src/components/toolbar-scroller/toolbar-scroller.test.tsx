import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, type Ref, useImperativeHandle, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CopyGlyph } from '../../core/glyphs.js';
import { UiProvider } from '../../core/provider.js';
import { ToolbarScroller } from './toolbar-scroller.js';

function stubStrip(strip: HTMLElement, scrollWidth: number, clientWidth: number, scrollLeft = 0) {
  Object.defineProperties(strip, {
    clientWidth: { configurable: true, value: clientWidth },
    scrollWidth: { configurable: true, value: scrollWidth },
    scrollLeft: { configurable: true, value: scrollLeft, writable: true },
  });
}

function rect(left: number, width: number): DOMRect {
  return {
    left,
    right: left + width,
    width,
    top: 0,
    bottom: 20,
    height: 20,
    x: left,
    y: 0,
    toJSON: () => ({}),
  };
}

function Tools() {
  return (
    <>
      <button type="button">Bold</button>
      <button type="button">Italic</button>
      <button type="button">Underline</button>
    </>
  );
}

function parts(container: HTMLElement) {
  const root = container.querySelector<HTMLElement>('.ui-toolbar-scroller');
  const strip = container.querySelector<HTMLElement>('.ui-toolbar-scroller__strip');
  if (!root || !strip) throw new Error('scroller did not render');
  const fade = (edge: string) =>
    container.querySelector<HTMLElement>(`.ui-toolbar-scroller__fade[data-edge="${edge}"]`);
  const button = (edge: string) =>
    container.querySelector<HTMLButtonElement>(
      `.ui-toolbar-scroller__scroll-button[data-edge="${edge}"]`,
    );
  return { root, strip, fade, button };
}

/** Lets the strip's pending overflow measurement run; measurements wait for an animation frame. */
async function nextFrame() {
  await act(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  });
}

function wheel(target: Element, init: WheelEventInit) {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe('ToolbarScroller', () => {
  it('UIC-TOOLBAR-SCROLLER-3.1 retains each tool state when numeric and text IDs reorder', async () => {
    const user = userEvent.setup();
    const items = [
      { id: 1, label: 'Numeric tool' },
      { id: '1', label: 'Text tool' },
    ];
    const renderItem = (item: (typeof items)[number]) => (
      <input aria-label={item.label} defaultValue={item.label} />
    );
    const { rerender } = render(<ToolbarScroller items={items} renderItem={renderItem} />);
    await user.type(screen.getByRole('textbox', { name: 'Numeric tool' }), ' changed');
    rerender(<ToolbarScroller items={[...items].reverse()} renderItem={renderItem} />);
    expect(screen.getByRole('textbox', { name: 'Numeric tool' })).toHaveValue(
      'Numeric tool changed',
    );
    expect(screen.getByRole('textbox', { name: 'Text tool' })).toHaveValue('Text tool');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-TOOLBAR-SCROLLER-1.1 keeps the tools as direct children of one strip', () => {
    const { container } = render(
      <ToolbarScroller aria-label="Format" showEdgeFades>
        <Tools />
      </ToolbarScroller>,
    );
    const { strip } = parts(container);
    expect(Array.from(strip.children, (child) => child.textContent)).toEqual([
      'Bold',
      'Italic',
      'Underline',
    ]);
    expectHooksMatchSpec(container, 'TOOLBAR-SCROLLER', {
      slots: ['strip', 'fade', 'scroll-button'],
    });
  });

  it('UIC-TOOLBAR-SCROLLER-1.2 is a named horizontal toolbar with arrow-key focus', async () => {
    render(
      <>
        <ToolbarScroller aria-label="Format">
          <Tools />
        </ToolbarScroller>
        <button type="button">After</button>
      </>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Format' });
    expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
    expect(toolbar).toHaveAttribute('data-orientation', 'horizontal');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
  });

  it('UIC-TOOLBAR-SCROLLER-1.2 mirrors the arrow keys right to left and defers to an outer toolbar', async () => {
    const { unmount } = render(
      <UiProvider locale="he-IL">
        <ToolbarScroller aria-label="Format">
          <Tools />
        </ToolbarScroller>
      </UiProvider>,
    );
    await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    unmount();

    render(
      <div role="toolbar" aria-label="Outer">
        <ToolbarScroller aria-label="Inner">
          <Tools />
        </ToolbarScroller>
      </div>,
    );
    expect(screen.getByRole('group', { name: 'Inner' })).toHaveClass('ui-toolbar-scroller__strip');
  });

  it('UIC-TOOLBAR-SCROLLER-1.3 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <ToolbarScroller
        aria-label="Format"
        className="caller"
        id="format-tools"
        data-testid="probe"
        data-overflow-end="spoof"
      >
        <Tools />
      </ToolbarScroller>,
    );
    const { root } = parts(container);
    expect(root).toHaveClass('ui-toolbar-scroller', 'caller');
    expect(root).toHaveAttribute('id', 'format-tools');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'TOOLBAR-SCROLLER', {
      callerAttributes: ['data-overflow-end'],
    });
  });

  it('UIC-TOOLBAR-SCROLLER-2.2 draws no fades without showEdgeFades', async () => {
    const { container } = render(
      <ToolbarScroller aria-label="Format">
        <Tools />
      </ToolbarScroller>,
    );
    const { root, strip, button } = parts(container);
    stubStrip(strip, 400, 100);
    fireEvent.scroll(strip);
    await nextFrame();
    expect(root).toHaveAttribute('data-overflow-end', 'true');
    expect(button('end')?.hidden).toBe(false);
    expect(container.querySelector('.ui-toolbar-scroller__fade')).toBeNull();
  });

  it('UIC-TOOLBAR-SCROLLER-2.1 UIC-TOOLBAR-SCROLLER-2.2 UIC-TOOLBAR-SCROLLER-2.3 publishes each hidden edge with its fade and scroll button', async () => {
    const { container } = render(
      <ToolbarScroller aria-label="Format" showEdgeFades>
        <Tools />
      </ToolbarScroller>,
    );
    const { root, strip, fade, button } = parts(container);
    expect(root).not.toHaveAttribute('data-overflow-start');
    expect(root).not.toHaveAttribute('data-overflow-end');
    for (const edge of ['start', 'end']) {
      expect(fade(edge)).toHaveAttribute('aria-hidden', 'true');
      expect(fade(edge)?.hidden).toBe(true);
      expect(button(edge)?.hidden).toBe(true);
    }

    stubStrip(strip, 400, 100);
    fireEvent.scroll(strip);
    await nextFrame();
    expect(root).not.toHaveAttribute('data-overflow-start');
    expect(root).toHaveAttribute('data-overflow-end', 'true');
    expect(fade('start')?.hidden).toBe(true);
    expect(fade('end')?.hidden).toBe(false);
    expect(button('start')?.hidden).toBe(true);
    expect(button('end')?.hidden).toBe(false);

    stubStrip(strip, 400, 100, 120);
    fireEvent.scroll(strip);
    await nextFrame();
    expect(root).toHaveAttribute('data-overflow-start', 'true');
    expect(root).toHaveAttribute('data-overflow-end', 'true');
    expectHooksMatchSpec(container, 'TOOLBAR-SCROLLER', {
      slots: ['strip', 'fade', 'scroll-button'],
    });

    stubStrip(strip, 400, 100, 300);
    fireEvent.scroll(strip);
    await nextFrame();
    expect(root).toHaveAttribute('data-overflow-start', 'true');
    expect(root).not.toHaveAttribute('data-overflow-end');
    expect(button('end')?.hidden).toBe(true);

    stubStrip(strip, 400, 100, -120);
    fireEvent.scroll(strip);
    await nextFrame();
    expect(root).toHaveAttribute('data-overflow-start', 'true');
    expect(root).toHaveAttribute('data-overflow-end', 'true');
  });

  it('UIC-TOOLBAR-SCROLLER-2.1 remeasures when a child mounts or unmounts and observes child resizes', async () => {
    const observed = new Set<Element>();
    let resizeCallback: ResizeObserverCallback = () => undefined;
    class StubResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      observe(target: Element) {
        observed.add(target);
      }
      unobserve(target: Element) {
        observed.delete(target);
      }
      disconnect() {
        observed.clear();
      }
    }
    vi.stubGlobal('ResizeObserver', StubResizeObserver);
    const label = createRef<{ show: (shown: boolean) => void }>();
    function LateLabel({ ref }: { ref: Ref<{ show: (shown: boolean) => void }> }) {
      const [shown, setShown] = useState(false);
      useImperativeHandle(ref, () => ({ show: setShown }), []);
      return shown ? <span data-late="true">Saved</span> : null;
    }
    const { container } = render(
      <ToolbarScroller aria-label="Format">
        <button type="button">Bold</button>
        <LateLabel ref={label} />
      </ToolbarScroller>,
    );
    const { root, strip } = parts(container);
    stubStrip(strip, 100, 100);
    fireEvent.scroll(strip);
    await nextFrame();
    expect(root).not.toHaveAttribute('data-overflow-end');

    stubStrip(strip, 160, 100);
    await act(async () => label.current?.show(true));
    await nextFrame();
    const late = strip.querySelector('[data-late]');
    expect(late && observed.has(late)).toBe(true);
    expect(root).toHaveAttribute('data-overflow-end', 'true');

    stubStrip(strip, 100, 100);
    await act(async () => label.current?.show(false));
    await nextFrame();
    expect(late && observed.has(late)).toBe(false);
    expect(root).not.toHaveAttribute('data-overflow-end');

    stubStrip(strip, 300, 100);
    act(() => resizeCallback([], {} as ResizeObserver));
    await nextFrame();
    expect(root).toHaveAttribute('data-overflow-end', 'true');
  });

  it('UIC-TOOLBAR-SCROLLER-2.3 scroll buttons page toward their edge, stay out of the tab order, and can be turned off', async () => {
    const { container, rerender } = render(
      <ToolbarScroller aria-label="Format">
        <Tools />
      </ToolbarScroller>,
    );
    const { strip, button } = parts(container);
    stubStrip(strip, 400, 100);
    const scrollTo = vi.fn((options: ScrollToOptions) => {
      strip.scrollLeft = options.left ?? strip.scrollLeft;
    });
    strip.scrollTo = scrollTo as typeof strip.scrollTo;
    fireEvent.scroll(strip);
    await nextFrame();
    const end = button('end') as HTMLButtonElement;
    expect(end).toHaveAccessibleName('Scroll forward');
    expect(end).toHaveAttribute('tabindex', '-1');
    expect(end.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'chevron-right');
    expect(strip.contains(end)).toBe(false);
    await userEvent.click(end);
    expect(strip.scrollLeft).toBe(80);
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 80, behavior: 'auto' });
    await nextFrame();
    expect(button('start')?.hidden).toBe(false);
    expect(button('start')).toHaveAccessibleName('Scroll backward');
    await userEvent.click(button('start') as HTMLButtonElement);
    expect(strip.scrollLeft).toBe(0);
    await nextFrame();
    expect(button('start')?.hidden).toBe(true);

    rerender(
      <ToolbarScroller aria-label="Format" scrollButtons={false} showEdgeFades>
        <Tools />
      </ToolbarScroller>,
    );
    expect(container.querySelector('.ui-toolbar-scroller__scroll-button')).toBeNull();
    expect(container.querySelectorAll('.ui-toolbar-scroller__fade')).toHaveLength(2);
  });

  it('UIC-TOOLBAR-SCROLLER-2.3 mirrors the scroll buttons right to left', async () => {
    const { container } = render(
      <UiProvider locale="ar-EG">
        <ToolbarScroller aria-label="Format">
          <Tools />
        </ToolbarScroller>
      </UiProvider>,
    );
    const { strip, button } = parts(container);
    stubStrip(strip, 400, 100);
    fireEvent.scroll(strip);
    await nextFrame();
    expect(button('end')?.querySelector('[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'chevron-left',
    );
    expect(button('start')?.querySelector('[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'chevron-right',
    );
    await userEvent.click(button('end') as HTMLButtonElement);
    expect(strip.scrollLeft).toBe(-80);
  });

  it('UIC-TOOLBAR-SCROLLER-2.4 turns wheel input into horizontal scroll and keeps it from the page at both bounds', () => {
    const { container } = render(
      <ToolbarScroller aria-label="Format">
        <Tools />
      </ToolbarScroller>,
    );
    const { strip } = parts(container);
    stubStrip(strip, 400, 100);
    const tool = screen.getByRole('button', { name: 'Bold' });
    const down = wheel(tool, { deltaY: 120 });
    expect(strip.scrollLeft).toBe(120);
    expect(down.defaultPrevented).toBe(true);

    expect(wheel(strip, { deltaY: 2, deltaMode: 1 }).defaultPrevented).toBe(true);
    expect(strip.scrollLeft).toBe(152);
    wheel(strip, { deltaY: -1, deltaMode: 2 });
    expect(strip.scrollLeft).toBe(52);

    expect(wheel(strip, { deltaX: 80, deltaY: 10 }).defaultPrevented).toBe(true);
    expect(strip.scrollLeft).toBe(132);
    expect(wheel(strip, { deltaY: 50, ctrlKey: true }).defaultPrevented).toBe(false);
    expect(wheel(strip, { deltaY: 50, metaKey: true }).defaultPrevented).toBe(false);
    expect(strip.scrollLeft).toBe(132);

    // At the end bound the strip still owns the wheel, so the page does not scroll behind it.
    stubStrip(strip, 400, 100, 300);
    expect(wheel(strip, { deltaY: 50 }).defaultPrevented).toBe(true);
    expect(strip.scrollLeft).toBe(300);
    stubStrip(strip, 400, 100, 0);
    expect(wheel(strip, { deltaY: -50 }).defaultPrevented).toBe(true);
    // A strip that fits leaves the wheel to the page.
    stubStrip(strip, 100, 100);
    expect(wheel(strip, { deltaY: 50 }).defaultPrevented).toBe(false);
  });

  it('UIC-TOOLBAR-SCROLLER-2.1 UIC-TOOLBAR-SCROLLER-2.4 follows a strip that mounts after a switch from the overflow menu', async () => {
    const items = [
      { id: 'bold', label: 'Bold' },
      { id: 'italic', label: 'Italic' },
    ];
    const renderItem = (item: { label: string }) => <button type="button">{item.label}</button>;
    const { container, rerender } = render(
      <ToolbarScroller aria-label="Format" overflow="menu" items={items} renderItem={renderItem} />,
    );
    expect(container.querySelector('.ui-toolbar-scroller')).toHaveAttribute(
      'data-overflow',
      'menu',
    );
    rerender(
      <ToolbarScroller
        aria-label="Format"
        overflow="scroll"
        items={items}
        renderItem={renderItem}
      />,
    );
    const { root, strip } = parts(container);
    stubStrip(strip, 400, 100);
    const down = wheel(screen.getByRole('button', { name: 'Bold' }), { deltaY: 120 });
    expect(strip.scrollLeft).toBe(120);
    expect(down.defaultPrevented).toBe(true);
    // The mutation observer of the late strip remeasures when a child is added.
    act(() => strip.append(document.createElement('span')));
    await nextFrame();
    expect(root).toHaveAttribute('data-overflow-start', 'true');
    expect(root).toHaveAttribute('data-overflow-end', 'true');
  });

  it('UIC-TOOLBAR-SCROLLER-2.4 leaves the wheel to a popup open inside the strip', () => {
    const { container } = render(
      <ToolbarScroller aria-label="Format">
        <button type="button">Bold</button>
        <div role="menu" aria-label="Styles">
          <div role="menuitem" tabIndex={-1}>
            Heading
          </div>
        </div>
        <div role="listbox" aria-label="Sizes">
          <div role="option" aria-selected="false">
            Large
          </div>
        </div>
      </ToolbarScroller>,
    );
    const { strip } = parts(container);
    stubStrip(strip, 400, 100);
    for (const item of [screen.getByText('Heading'), screen.getByText('Large')]) {
      expect(wheel(item, { deltaY: 120 }).defaultPrevented).toBe(false);
      expect(strip.scrollLeft).toBe(0);
    }
    expect(wheel(screen.getByText('Bold'), { deltaY: 120 }).defaultPrevented).toBe(true);
  });

  it('UIC-TOOLBAR-SCROLLER-2.4 scrolls toward the end edge right to left', () => {
    const { container } = render(
      <UiProvider locale="he-IL">
        <ToolbarScroller aria-label="Format">
          <Tools />
        </ToolbarScroller>
      </UiProvider>,
    );
    const { strip } = parts(container);
    stubStrip(strip, 400, 100);
    // jsdom computes no direction from the locale's stylesheet, so the strip states it inline.
    strip.style.direction = 'rtl';
    wheel(strip, { deltaY: 120 });
    expect(strip.scrollLeft).toBe(-120);
  });

  it('UIC-TOOLBAR-SCROLLER-2.5 scrolls a focused tool clear of the covering scroll button', async () => {
    const { container } = render(
      <ToolbarScroller aria-label="Format" showEdgeFades>
        <Tools />
      </ToolbarScroller>,
    );
    const { strip, button, fade } = parts(container);
    stubStrip(strip, 400, 100);
    fireEvent.scroll(strip);
    await nextFrame();
    strip.getBoundingClientRect = () => rect(0, 100);
    (button('end') as HTMLElement).getBoundingClientRect = () => rect(76, 24);
    (fade('end') as HTMLElement).getBoundingClientRect = () => rect(84, 16);
    const underline = screen.getByRole('button', { name: 'Underline' });
    underline.getBoundingClientRect = () => rect(60, 30);
    act(() => underline.focus());
    expect(strip.scrollLeft).toBe(14);

    stubStrip(strip, 400, 100, 50);
    fireEvent.scroll(strip);
    await nextFrame();
    (button('start') as HTMLElement).getBoundingClientRect = () => rect(0, 24);
    const bold = screen.getByRole('button', { name: 'Bold' });
    bold.getBoundingClientRect = () => rect(10, 30);
    act(() => bold.focus());
    expect(strip.scrollLeft).toBe(36);

    const italic = screen.getByRole('button', { name: 'Italic' });
    italic.getBoundingClientRect = () => rect(30, 20);
    act(() => italic.focus());
    expect(strip.scrollLeft).toBe(36);
  });

  it('UIC-TOOLBAR-SCROLLER-3.1 draws tools from data as direct children of the scrolling strip', () => {
    const { container } = render(
      <ToolbarScroller
        aria-label="Format"
        items={[
          { id: 'bold', label: 'Bold' },
          { id: 'italic', label: 'Italic' },
        ]}
        renderItem={(item) => <button type="button">{item.label}</button>}
      />,
    );
    const { root, strip } = parts(container);
    expect(root).toHaveAttribute('data-overflow', 'scroll');
    expect(Array.from(strip.children, (child) => child.textContent)).toEqual(['Bold', 'Italic']);
  });

  it('UIC-TOOLBAR-SCROLLER-3.2 keeps the tools that fit by priority and lists the others in a menu', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const width = this.classList.contains('ui-toolbar-scroller__item')
        ? (this.textContent ?? '').length * 10
        : 0;
      return new DOMRect(0, 0, width, 24);
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.getAttribute('role') === 'toolbar' ? 160 : 0;
    });
    const onLink = vi.fn();
    try {
      const { container } = render(
        <ToolbarScroller
          aria-label="Format"
          overflow="menu"
          items={[
            { id: 'bold', label: 'Bold' },
            { id: 'italic', label: 'Italic' },
            { id: 'underline', label: 'Underline' },
            { id: 'link', label: 'Link', icon: CopyGlyph, priority: 1, onAction: onLink },
            { id: 'clear', label: 'Clear', isDisabled: true },
          ]}
          renderItem={(item) => <button type="button">{item.label}</button>}
        />,
      );
      const toolbar = screen.getByRole('toolbar', { name: 'Format' });
      expect(toolbar.parentElement).toHaveAttribute('data-overflow', 'menu');
      // Link (40) is kept first, then Bold (40) and Italic (60); Underline would not fit.
      expect(
        Array.from(
          container.querySelectorAll('.ui-toolbar-scroller__item'),
          (item) => item.textContent,
        ),
      ).toEqual(['Bold', 'Italic', 'Link']);
      expect(toolbar.lastElementChild).toHaveClass('ui-toolbar-scroller__overflow');
      expect(container.querySelector('.ui-toolbar-scroller__fade')).toBeNull();
      expectHooksMatchSpec(container, 'TOOLBAR-SCROLLER', { slots: ['strip', 'item', 'overflow'] });

      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
      const more = screen.getByRole('button', { name: '2 more items' });
      expect(more).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      expect((await screen.findAllByRole('menuitem')).map((item) => item.textContent)).toEqual([
        'Underline',
        'Clear',
      ]);
      expect(screen.getByRole('menuitem', { name: 'Clear' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('UIC-TOOLBAR-SCROLLER-3.3 keeps visible tools mounted with their drafts and focus across overflow modes', async () => {
    const user = userEvent.setup();
    let width = 400;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return new DOMRect(0, 0, this.classList.contains('ui-toolbar-scroller__item') ? 50 : 0, 24);
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.getAttribute('role') === 'toolbar' ? width : 0;
    });
    const items = [
      { id: 'search', label: 'Search' },
      { id: 'tag', label: 'Tag' },
      { id: 2, label: 'Two' },
    ];
    const draw = (item: { label: string }) => <input aria-label={item.label} />;
    const scroller = (props: { overflow: 'scroll' | 'menu'; scrollButtons?: boolean }) => (
      <ToolbarScroller aria-label="Tools" items={items} renderItem={draw} {...props} />
    );
    try {
      const { rerender } = render(scroller({ overflow: 'scroll' }));
      const search = screen.getByRole('textbox', { name: 'Search' });
      const two = screen.getByRole('textbox', { name: 'Two' });
      await user.type(search, 'draft');
      for (const props of [
        { overflow: 'menu' as const },
        { overflow: 'scroll' as const, scrollButtons: false },
        { overflow: 'scroll' as const },
        { overflow: 'menu' as const },
      ]) {
        rerender(scroller(props));
        expect(screen.getByRole('textbox', { name: 'Search' })).toBe(search);
        expect(search).toHaveValue('draft');
        expect(search).toHaveFocus();
        expect(screen.getByRole('textbox', { name: 'Two' })).toBe(two);
      }

      // A stable keyed reorder keeps each tool.
      items.reverse();
      rerender(scroller({ overflow: 'menu' }));
      expect(screen.getByRole('textbox', { name: 'Search' })).toBe(search);
      items.reverse();

      // Narrowed so that two tools no longer fit: the focused last tool collapses into the menu,
      // and focus moves to the menu button instead of falling to the page.
      two.focus();
      width = 120;
      rerender(scroller({ overflow: 'scroll' }));
      rerender(scroller({ overflow: 'menu' }));
      expect(screen.queryByRole('textbox', { name: 'Two' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^\d+ more/ })).toHaveFocus();
      expect(screen.getByRole('textbox', { name: 'Search' })).toBe(search);
    } finally {
      vi.restoreAllMocks();
    }
  });
});
