import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import {
  RESIZE_KEYBOARD_FINE_STEP,
  RESIZE_KEYBOARD_STEP,
  ResizeHandle,
  resolveResizeKeyboardValue,
} from './resize-handle.js';
import {
  SplitView,
  resolveInitialSplitSize,
  resolveSplitBounds,
  type SplitViewHandle,
  type SplitViewPane,
} from './split-view.js';

const fruit = ['Apples', 'Bananas', 'Cherries'];

function threePanes(extra: Partial<Parameters<typeof SplitView>[0]> = {}) {
  return (
    <SplitView
      panes={[{ id: 'a' }, { id: 'b' }, { id: 'c' }]}
      defaultSizes={[20, 30, 50]}
      {...extra}
    >
      {fruit.map((name) => (
        <p key={name}>{name}</p>
      ))}
    </SplitView>
  );
}

const panes: [SplitViewPane, SplitViewPane] = [
  { id: 'list', minSize: 10, maxSize: 80 },
  { id: 'detail', minSize: 20 },
];

function resizable(extra: Partial<Parameters<typeof SplitView>[0]> = {}) {
  return (
    <SplitView panes={panes} defaultSize={30} {...extra}>
      {[<p key="a">Apples</p>, <p key="b">Bananas</p>]}
    </SplitView>
  );
}

/** Gives the split a measured size and records pointer capture on the separator. */
function prepareDrag(container: HTMLElement, size = { width: 1000, height: 500 }) {
  const root = container.querySelector<HTMLElement>('.ui-split-view')!;
  Object.defineProperties(root, {
    clientWidth: { configurable: true, value: size.width },
    clientHeight: { configurable: true, value: size.height },
  });
  const handle = screen.getByRole('separator');
  const capture = { id: null as number | null };
  Object.assign(handle, {
    setPointerCapture: (id: number) => {
      capture.id = id;
    },
    hasPointerCapture: (id: number) => capture.id === id,
    releasePointerCapture: (id: number) => {
      if (capture.id === id) capture.id = null;
    },
  });
  return { root, handle, capture };
}

function pointer(
  type: 'pointerDown' | 'pointerMove' | 'pointerUp' | 'pointerCancel',
  target: Element,
  init: PointerEventInit,
) {
  fireEvent[type](target, { pointerId: 7, button: 0, isPrimary: true, ...init });
}

describe('SplitView', () => {
  it('UIC-SPLIT-VIEW-1.1 renders a fixed split with its orientation, ratio and gap and no separator', () => {
    const { container, rerender } = render(
      <SplitView>
        <p>Apples</p>
        <p>Bananas</p>
      </SplitView>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveClass('ui-split-view');
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
    expect(root).toHaveAttribute('data-ratio', 'equal');
    expect(root).toHaveAttribute('data-space', 'none');
    expect(Array.from(root.children, (child) => child.tagName)).toEqual(['P', 'P']);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'SPLIT-VIEW');

    for (const ratio of [
      'equal',
      'main-sidebar',
      'main-rail',
      'content-main',
      'main-content',
    ] as const) {
      rerender(
        <SplitView orientation="vertical" ratio={ratio} space="md">
          <p>Apples</p>
          <p>Bananas</p>
        </SplitView>,
      );
      expect(root).toHaveAttribute('data-orientation', 'vertical');
      expect(root).toHaveAttribute('data-ratio', ratio);
      expect(root).toHaveAttribute('data-space', 'md');
      expectHooksMatchSpec(container, 'SPLIT-VIEW');
    }
  });

  it('UIC-SPLIT-VIEW-1.2 fills and clips by default and takes growth', () => {
    const { container, rerender } = render(<SplitView />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-fill', 'true');
    expect(root).toHaveAttribute('data-clip', 'true');
    expect(root).not.toHaveAttribute('data-grow');
    rerender(<SplitView fill={false} clip={false} grow />);
    expect(root).not.toHaveAttribute('data-fill');
    expect(root).not.toHaveAttribute('data-clip');
    expect(root).toHaveAttribute('data-grow', 'true');
    rerender(resizable({ fill: false, grow: 'auto' }));
    expect(container.firstElementChild).not.toHaveAttribute('data-fill');
    expect(container.firstElementChild).toHaveAttribute('data-clip', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-grow', 'auto');
    expectHooksMatchSpec(container, 'SPLIT-VIEW');
  });

  it('UIC-SPLIT-VIEW-2.1 renders two panes around a named separator that controls both', () => {
    const { container, rerender } = render(resizable());
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('data-resizable', 'true');
    const [first, handle, second] = Array.from(root.children);
    expect(first).toHaveClass('ui-split-view__pane');
    expect(first).toHaveAttribute('data-pane', 'first');
    expect(first).toHaveAttribute('id', 'list');
    expect(first).toHaveTextContent('Apples');
    expect(handle).toHaveAttribute('role', 'separator');
    expect(second).toHaveAttribute('data-pane', 'second');
    expect(second).toHaveAttribute('id', 'detail');
    const separator = screen.getByRole('separator', { name: 'Resize' });
    expect(separator).toHaveAttribute('aria-controls', 'list detail');
    expectHooksMatchSpec(container, 'SPLIT-VIEW', { slots: ['pane', 'grip'] });

    rerender(
      <UiProvider strings={{ resize: 'Redimensionner' }}>
        <SplitView panes={[{}, {}]} separatorLabel="Resize fruit list">
          {[<p key="a">Apples</p>, <p key="b">Bananas</p>]}
        </SplitView>
      </UiProvider>,
    );
    const generated = screen.getByRole('separator', { name: 'Resize fruit list' });
    const [firstId, secondId] = generated.getAttribute('aria-controls')!.split(' ');
    expect(document.getElementById(firstId!)).toHaveTextContent('Apples');
    expect(document.getElementById(secondId!)).toHaveTextContent('Bananas');
    rerender(
      <UiProvider strings={{ resize: 'Redimensionner' }}>
        <SplitView panes={[{}, {}]}>{[<p key="a">Apples</p>, <p key="b">Bananas</p>]}</SplitView>
      </UiProvider>,
    );
    expect(screen.getByRole('separator', { name: 'Redimensionner' })).toBeInTheDocument();
  });

  it('UIC-SPLIT-VIEW-2.2 combines both panes into the bounds and starts from stored, default or half', () => {
    expect(resolveSplitBounds(panes)).toEqual({ min: 10, max: 80 });
    expect(resolveSplitBounds([{}, {}])).toEqual({ min: 10, max: 90 });
    expect(resolveSplitBounds([{ maxSize: 95 }, { minSize: 30 }])).toEqual({ min: 10, max: 70 });
    expect(resolveSplitBounds([{ minSize: 5 }, { maxSize: 60 }])).toEqual({ min: 40, max: 90 });
    expect(resolveSplitBounds([{ minSize: 70 }, { minSize: 50 }])).toEqual({ min: 50, max: 50 });
    expect(resolveInitialSplitSize(panes, 30)).toBe(30);
    expect(resolveInitialSplitSize(panes, 30, 55)).toBe(55);
    expect(resolveInitialSplitSize(panes, 30, 1)).toBe(10);
    expect(resolveInitialSplitSize(panes, 30, 999)).toBe(80);
    expect(resolveInitialSplitSize([{}, {}])).toBe(50);
    expect(resolveInitialSplitSize([{ maxSize: 95 }, { minSize: 30 }], 95)).toBe(70);

    const { container } = render(resizable());
    const first = container.querySelector<HTMLElement>('[data-pane="first"]')!;
    expect(first.style.flexBasis).toBe('30%');
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-valuenow', '30');
    expect(separator).toHaveAttribute('aria-valuemin', '10');
    expect(separator).toHaveAttribute('aria-valuemax', '80');
  });

  it('UIC-SPLIT-VIEW-2.3 reports size changes and follows a controlled size', async () => {
    const user = userEvent.setup();
    const onSizeChange = vi.fn();
    const onSizeChangeEnd = vi.fn();
    function Controlled() {
      const [size, setSize] = useState(40);
      return (
        <>
          <output>{size}</output>
          <SplitView
            panes={panes}
            size={size}
            onSizeChange={(next) => {
              onSizeChange(next);
              setSize(next);
            }}
            onSizeChangeEnd={onSizeChangeEnd}
          >
            {[<p key="a">Apples</p>, <p key="b">Bananas</p>]}
          </SplitView>
        </>
      );
    }
    const { container } = render(<Controlled />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-valuenow', '40');
    separator.focus();
    await user.keyboard('{ArrowRight}');
    expect(onSizeChange).toHaveBeenLastCalledWith(45);
    expect(onSizeChangeEnd).toHaveBeenLastCalledWith(45);
    expect(screen.getByRole('status')).toHaveTextContent('45');
    expect(separator).toHaveAttribute('aria-valuenow', '45');
    expect(container.querySelector<HTMLElement>('[data-pane="first"]')!.style.flexBasis).toBe(
      '45%',
    );
  });

  it('UIC-SPLIT-VIEW-2.3 keeps an uncontrolled size that ignores a later default', async () => {
    const user = userEvent.setup();
    const { rerender } = render(resizable());
    const separator = screen.getByRole('separator');
    separator.focus();
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(separator).toHaveAttribute('aria-valuenow', '29');
    rerender(resizable({ defaultSize: 60 }));
    expect(separator).toHaveAttribute('aria-valuenow', '29');
  });

  it('UIC-SPLIT-VIEW-2.4 restores and saves the size through the provider storage, not during a drag', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ 'fruit.split': '42' });
    const setItem = vi.spyOn(storage, 'setItem');
    const { container, unmount } = render(
      <UiProvider storage={storage}>{resizable({ persistKey: 'fruit.split' })}</UiProvider>,
    );
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-valuenow', '42');
    separator.focus();
    await user.keyboard('{End}');
    expect(storage.getItem('fruit.split')).toBe('80');

    const { handle } = prepareDrag(container);
    setItem.mockClear();
    pointer('pointerDown', handle, { clientX: 800 });
    pointer('pointerMove', handle, { clientX: 500 });
    expect(handle).toHaveAttribute('aria-valuenow', '50');
    expect(setItem).not.toHaveBeenCalled();
    pointer('pointerUp', handle, { clientX: 400 });
    expect(storage.getItem('fruit.split')).toBe('40');
    unmount();

    storage.setItem('fruit.split', 'wide');
    render(<UiProvider storage={storage}>{resizable({ persistKey: 'fruit.split' })}</UiProvider>);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '30');
  });
});

describe('SplitView panes', () => {
  it('UIC-SPLIT-VIEW-2.1 UIC-SPLIT-VIEW-2.2 lays out three panes with a separator between each pair', async () => {
    const user = userEvent.setup();
    const { container } = render(
      threePanes({ separatorLabel: (index: number) => `Resize ${fruit[index]}` }),
    );
    const root = container.firstElementChild!;
    expect(Array.from(root.children, (child) => child.getAttribute('role') ?? child.id)).toEqual([
      'a',
      'separator',
      'b',
      'separator',
      'c',
    ]);
    const [a, b, c] = ['a', 'b', 'c'].map((id) => document.getElementById(id)!);
    expect(a).toHaveAttribute('data-pane', 'first');
    expect(b).toHaveAttribute('data-pane', 'second');
    expect(c).not.toHaveAttribute('data-pane');
    expect(c).toHaveAttribute('data-flexible', 'true');
    expect(a).not.toHaveAttribute('data-flexible');
    expect(a!.style.flexBasis).toBe('20%');
    expect(b!.style.flexBasis).toBe('30%');
    expect(c!.style.flexBasis).toBe('');
    const first = screen.getByRole('separator', { name: 'Resize Apples' });
    const second = screen.getByRole('separator', { name: 'Resize Bananas' });
    expect(first).toHaveAttribute('aria-controls', 'a b');
    expect(second).toHaveAttribute('aria-controls', 'b c');
    expect(second).toHaveAttribute('aria-valuenow', '30');
    expect(second).toHaveAttribute('aria-valuemax', '70');
    expectHooksMatchSpec(container, 'SPLIT-VIEW', { slots: ['pane', 'grip'] });

    second.focus();
    await user.keyboard('{End}');
    expect(b!.style.flexBasis).toBe('70%');
    expect(a!.style.flexBasis).toBe('20%');
    expect(first).toHaveAttribute('aria-valuemax', '80');
  });

  it('UIC-SPLIT-VIEW-2.3 controls every pane size and reports the sizes', async () => {
    const user = userEvent.setup();
    const onSizesChangeEnd = vi.fn();
    function Controlled() {
      const [sizes, setSizes] = useState<readonly number[]>([20, 30, 50]);
      return threePanes({ sizes, onSizesChange: setSizes, onSizesChangeEnd });
    }
    render(<Controlled />);
    const separator = screen.getAllByRole('separator')[0]!;
    separator.focus();
    await user.keyboard('{ArrowRight}');
    expect(onSizesChangeEnd).toHaveBeenLastCalledWith([25, 25, 50]);
    expect(separator).toHaveAttribute('aria-valuenow', '25');
    expect(document.getElementById('b')!.style.flexBasis).toBe('25%');
  });

  it('UIC-SPLIT-VIEW-2.4 saves the sizes of three panes as a list and ignores ones that do not fit', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ trio: '[40,20,40]' });
    const { unmount } = render(
      <UiProvider storage={storage}>{threePanes({ persistKey: 'trio' })}</UiProvider>,
    );
    expect(screen.getAllByRole('separator')[0]).toHaveAttribute('aria-valuenow', '40');
    screen.getAllByRole('separator')[1]!.focus();
    await user.keyboard('{ArrowRight}');
    expect(storage.getItem('trio')).toBe('[40,25,35]');
    unmount();
    storage.setItem('trio', '[40,60]');
    render(<UiProvider storage={storage}>{threePanes({ persistKey: 'trio' })}</UiProvider>);
    expect(screen.getAllByRole('separator')[0]).toHaveAttribute('aria-valuenow', '20');
  });

  it('UIC-SPLIT-VIEW-2.5 keeps a pixel pane in pixels and drags it pixel for pixel', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SplitView
        panes={[{ id: 'rail', unit: 'pixel', minSize: 100, maxSize: 400 }, { id: 'main' }]}
        defaultSizes={[240]}
      >
        {[<p key="a">Tools</p>, <p key="b">Canvas</p>]}
      </SplitView>,
    );
    const rail = document.getElementById('rail')!;
    const main = document.getElementById('main')!;
    expect(rail.style.flexBasis).toBe('240px');
    expect(main).toHaveAttribute('data-flexible', 'true');
    const { handle } = prepareDrag(container);
    expect(handle).toHaveAttribute('aria-valuenow', '240');
    expect(handle).toHaveAttribute('aria-valuemin', '100');
    pointer('pointerDown', handle, { clientX: 240 });
    pointer('pointerMove', handle, { clientX: 300 });
    pointer('pointerUp', handle, { clientX: 300 });
    expect(rail.style.flexBasis).toBe('300px');
    handle.focus();
    await user.keyboard('{ArrowLeft}');
    expect(handle).toHaveAttribute('aria-valuenow', '295');

    render(
      <SplitView
        panes={[{ id: 'list' }, { id: 'aside', unit: 'pixel', minSize: 120 }]}
        defaultSizes={[100, 200]}
      >
        {[<p key="a">List</p>, <p key="b">Aside</p>]}
      </SplitView>,
    );
    const list = document.getElementById('list')!;
    expect(list).toHaveAttribute('data-flexible', 'true');
    expect(document.getElementById('aside')!.style.flexBasis).toBe('200px');
    const trailing = screen.getAllByRole('separator')[1]!;
    expect(trailing).toHaveAttribute('aria-valuenow', '200');
    trailing.focus();
    await user.keyboard('{ArrowRight}');
    expect(trailing).toHaveAttribute('aria-valuenow', '195');
  });

  it('UIC-SPLIT-VIEW-2.6 collapses a pane by drag, Enter and Home and reports it', async () => {
    const user = userEvent.setup();
    const onCollapse = vi.fn();
    const onExpand = vi.fn();
    const { container } = render(
      <SplitView
        panes={[{ id: 'list' }, { id: 'detail', collapsible: true, minSize: 20 }]}
        defaultSize={60}
        onCollapse={onCollapse}
        onExpand={onExpand}
      >
        {[<p key="a">List</p>, <button key="b">Detail</button>]}
      </SplitView>,
    );
    const detail = document.getElementById('detail')!;
    const { handle } = prepareDrag(container);
    expect(handle).toHaveAttribute('aria-valuemax', '100');
    pointer('pointerDown', handle, { clientX: 600 });
    pointer('pointerMove', handle, { clientX: 880 });
    expect(handle).toHaveAttribute('aria-valuenow', '80');
    expect(detail).not.toHaveAttribute('data-collapsed');
    pointer('pointerMove', handle, { clientX: 920 });
    expect(handle).toHaveAttribute('aria-valuenow', '100');
    expect(detail).toHaveAttribute('data-collapsed', 'true');
    expect(detail).toHaveAttribute('inert');
    expect(onCollapse).toHaveBeenLastCalledWith(1);
    pointer('pointerUp', handle, { clientX: 920 });
    expectHooksMatchSpec(container, 'SPLIT-VIEW', { slots: ['pane', 'grip'] });

    handle.focus();
    await user.keyboard('{Enter}');
    expect(onExpand).toHaveBeenLastCalledWith(1);
    expect(detail).not.toHaveAttribute('data-collapsed');
    expect(detail).not.toHaveAttribute('inert');
    expect(handle).toHaveAttribute('aria-valuenow', '80');
    await user.keyboard('{Enter}');
    expect(detail).toHaveAttribute('data-collapsed', 'true');
    expect(onCollapse).toHaveBeenCalledTimes(2);
    await user.keyboard('{Enter}');
    await user.keyboard('{End}');
    expect(detail).toHaveAttribute('data-collapsed', 'true');
    expect(onCollapse).toHaveBeenCalledTimes(3);
    await user.keyboard('{Home}');
    expect(handle).toHaveAttribute('aria-valuenow', '10');
    expect(onExpand).toHaveBeenCalledTimes(3);
  });

  it('UIC-SPLIT-VIEW-2.6 keeps a collapsed pane with a size usable', async () => {
    const user = userEvent.setup();
    render(
      <SplitView
        panes={[{ id: 'rail', collapsible: true, collapsedSize: 5, minSize: 20 }, { id: 'main' }]}
        defaultSize={30}
      >
        {[<p key="a">Rail</p>, <p key="b">Main</p>]}
      </SplitView>,
    );
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-valuemin', '5');
    separator.focus();
    await user.keyboard('{Home}');
    const rail = document.getElementById('rail')!;
    expect(rail).toHaveAttribute('data-collapsed', 'true');
    expect(rail).not.toHaveAttribute('inert');
    expect(rail.style.flexBasis).toBe('5%');
  });

  it('UIC-SPLIT-VIEW-2.7 collapses, opens and resizes through the handle', () => {
    const handleRef = createRef<SplitViewHandle>();
    const onSizesChangeEnd = vi.fn();
    render(
      threePanes({
        panes: [{ id: 'a' }, { id: 'b', collapsible: true }, { id: 'c' }],
        handleRef,
        onSizesChangeEnd,
      }),
    );
    const [first, second] = screen.getAllByRole('separator');
    act(() => handleRef.current!.collapse(1));
    expect(document.getElementById('b')).toHaveAttribute('data-collapsed', 'true');
    expect(onSizesChangeEnd).toHaveBeenLastCalledWith([20, 0, 80]);
    act(() => handleRef.current!.collapse(0));
    expect(onSizesChangeEnd).toHaveBeenCalledTimes(1);
    act(() => handleRef.current!.expand(1));
    expect(onSizesChangeEnd).toHaveBeenLastCalledWith([20, 30, 50]);
    act(() => handleRef.current!.resize([50, 25, 25]));
    expect(first).toHaveAttribute('aria-valuenow', '50');
    expect(second).toHaveAttribute('aria-valuenow', '25');
  });
});

describe('ResizeHandle', () => {
  it('UIC-SPLIT-VIEW-3.1 is a focusable separator across the split reporting its rounded value and bounds', () => {
    const { container, rerender } = render(resizable({ defaultSize: 33.4 }));
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('tabindex', '0');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
    expect(separator).toHaveAttribute('aria-valuenow', '33');
    expect(separator.querySelector('.ui-resize-handle__grip')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    rerender(resizable({ orientation: 'vertical' }));
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
    expect(container.firstElementChild).toHaveAttribute('data-orientation', 'vertical');
    expectHooksMatchSpec(container, 'SPLIT-VIEW');
  });

  it('UIC-SPLIT-VIEW-3.2 steps 5 % with arrows, 1 % with Shift and jumps with Home and End', async () => {
    const user = userEvent.setup();
    const onSizeChange = vi.fn();
    render(resizable({ onSizeChange }));
    const separator = screen.getByRole('separator');
    separator.focus();
    await user.keyboard('{ArrowRight}');
    expect(separator).toHaveAttribute('aria-valuenow', '35');
    expect(onSizeChange).toHaveBeenLastCalledWith(35);
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(separator).toHaveAttribute('aria-valuenow', '34');
    await user.keyboard('{ArrowUp}{ArrowDown}{Enter}');
    expect(separator).toHaveAttribute('aria-valuenow', '34');
    await user.keyboard('{Home}');
    expect(separator).toHaveAttribute('aria-valuenow', '10');
    await user.keyboard('{ArrowLeft}');
    expect(separator).toHaveAttribute('aria-valuenow', '10');
    await user.keyboard('{End}');
    expect(separator).toHaveAttribute('aria-valuenow', '80');
  });

  it('UIC-SPLIT-VIEW-3.2 reverses horizontal arrows right to left and for a pane after the separator', async () => {
    const user = userEvent.setup();
    render(<UiProvider locale="he-IL">{resizable()}</UiProvider>);
    const separator = screen.getByRole('separator');
    separator.focus();
    await user.keyboard('{ArrowLeft}');
    expect(separator).toHaveAttribute('aria-valuenow', '35');

    const pixels = {
      orientation: 'horizontal' as const,
      value: 300,
      minValue: 120,
      maxValue: 640,
      extent: 800,
    };
    expect([RESIZE_KEYBOARD_STEP, RESIZE_KEYBOARD_FINE_STEP]).toEqual([5, 1]);
    expect(resolveResizeKeyboardValue({ key: 'ArrowDown', shiftKey: false }, pixels)).toBe(340);
    expect(resolveResizeKeyboardValue({ key: 'ArrowUp', shiftKey: true }, pixels)).toBe(292);
    expect(resolveResizeKeyboardValue({ key: 'Home', shiftKey: false }, pixels)).toBe(120);
    expect(resolveResizeKeyboardValue({ key: 'End', shiftKey: false }, pixels)).toBe(640);
    expect(
      resolveResizeKeyboardValue({ key: 'ArrowDown', shiftKey: false }, { ...pixels, value: 630 }),
    ).toBe(640);
    expect(resolveResizeKeyboardValue({ key: 'ArrowRight', shiftKey: false }, pixels)).toBeNull();
    expect(resolveResizeKeyboardValue({ key: 'Enter', shiftKey: false }, pixels)).toBeNull();
    expect(
      resolveResizeKeyboardValue(
        { key: 'ArrowDown', shiftKey: false },
        { ...pixels, sizedPane: 'after' },
      ),
    ).toBe(260);
    const percent = {
      orientation: 'vertical' as const,
      value: 30,
      minValue: 10,
      maxValue: 80,
      extent: 100,
    };
    expect(resolveResizeKeyboardValue({ key: 'ArrowRight', shiftKey: false }, percent)).toBe(35);
    expect(
      resolveResizeKeyboardValue(
        { key: 'ArrowRight', shiftKey: false },
        { ...percent, direction: 'rtl' },
      ),
    ).toBe(25);
    expect(resolveResizeKeyboardValue({ key: 'ArrowDown', shiftKey: false }, percent)).toBeNull();
  });

  it('UIC-SPLIT-VIEW-3.3 drags with pointer capture, shields the viewport and ends on release or cancel', async () => {
    const user = userEvent.setup();
    const onSizeChange = vi.fn();
    const onSizeChangeEnd = vi.fn();
    const { container } = render(resizable({ onSizeChange, onSizeChangeEnd }));
    const { root, handle, capture } = prepareDrag(container);

    pointer('pointerDown', handle, { clientX: 100, button: 2 });
    expect(capture.id).toBeNull();
    pointer('pointerDown', handle, { clientX: 100 });
    expect(capture.id).toBe(7);
    expect(handle).toHaveAttribute('data-resizing', 'true');
    expect(root).toHaveAttribute('data-resizing', 'true');
    const shield = container.querySelector<HTMLElement>('.ui-resize-handle__shield')!;
    expect(shield).toHaveAttribute('data-orientation', 'vertical');
    expect(shield).toHaveAttribute('aria-hidden', 'true');
    expect(shield.style.position).toBe('fixed');
    expectHooksMatchSpec(container, 'SPLIT-VIEW', { slots: 'all' });

    pointer('pointerMove', handle, { clientX: 300, pointerId: 8 });
    expect(handle).toHaveAttribute('aria-valuenow', '30');
    pointer('pointerMove', handle, { clientX: 300 });
    expect(handle).toHaveAttribute('aria-valuenow', '50');
    expect(onSizeChange).toHaveBeenLastCalledWith(50);
    expect(container.querySelector<HTMLElement>('[data-pane="first"]')!.style.flexBasis).toBe(
      '50%',
    );
    pointer('pointerMove', handle, { clientX: 900 });
    expect(handle).toHaveAttribute('aria-valuenow', '80');

    pointer('pointerCancel', handle, { clientX: 900 });
    expect(capture.id).toBeNull();
    expect(handle).not.toHaveAttribute('data-resizing');
    expect(root).not.toHaveAttribute('data-resizing');
    expect(container.querySelector('.ui-resize-handle__shield')).toBeNull();
    expect(onSizeChangeEnd).toHaveBeenLastCalledWith(80);

    pointer('pointerDown', handle, { clientX: 800 });
    pointer('pointerUp', handle, { clientX: 700 });
    expect(handle).toHaveAttribute('aria-valuenow', '70');
    expect(onSizeChangeEnd).toHaveBeenLastCalledWith(70);
    expect(container.querySelector('.ui-resize-handle__shield')).toBeNull();

    pointer('pointerDown', handle, { clientX: 700 });
    fireEvent.lostPointerCapture(handle, { pointerId: 7 });
    expect(handle).not.toHaveAttribute('data-resizing');

    handle.focus();
    await user.keyboard('{ArrowLeft}');
    expect(handle).not.toHaveAttribute('data-resizing');
    expect(container.querySelector('.ui-resize-handle__shield')).toBeNull();
  });

  it('UIC-SPLIT-VIEW-3.3 resizes a stacked split along the vertical axis', () => {
    const { container } = render(resizable({ orientation: 'vertical' }));
    const { handle } = prepareDrag(container, { width: 1000, height: 400 });
    pointer('pointerDown', handle, { clientX: 0, clientY: 120 });
    pointer('pointerMove', handle, { clientX: 500, clientY: 160 });
    expect(handle).toHaveAttribute('aria-valuenow', '40');
  });

  it('UIC-SPLIT-VIEW-3.3 UIC-SPLIT-VIEW-3.4 clears capture and the resize shield when disabled during a drag', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onChangeEnd = vi.fn();
    const onResizingChange = vi.fn();
    const props = {
      orientation: 'horizontal' as const,
      value: 300,
      minValue: 120,
      maxValue: 640,
      'aria-label': 'Resize details',
      onChange,
      onChangeEnd,
      onResizingChange,
    };
    const { container, rerender } = render(<ResizeHandle {...props} />);
    const handle = screen.getByRole('separator', { name: 'Resize details' });
    const release = vi.fn();
    Object.assign(handle, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: () => true,
      releasePointerCapture: release,
    });
    await user.pointer([
      { keys: '[MouseLeft>]', target: handle, coords: { clientY: 100 } },
      { coords: { clientY: 130 } },
    ]);
    expect(onChange).toHaveBeenLastCalledWith(330);
    expect(container.querySelector('.ui-resize-handle__shield')).not.toBeNull();
    rerender(<ResizeHandle {...props} isDisabled />);
    expect(release).toHaveBeenCalledTimes(1);
    expect(handle).not.toHaveAttribute('data-resizing');
    expect(container.querySelector('.ui-resize-handle__shield')).toBeNull();
    expect(onResizingChange.mock.calls).toEqual([[true], [false]]);
    onChange.mockClear();
    rerender(<ResizeHandle {...props} />);
    await user.pointer([{ coords: { clientY: 160 } }, { keys: '[/MouseLeft]' }]);
    expect(onChange).not.toHaveBeenCalled();
    expect(onChangeEnd).not.toHaveBeenCalled();
  });

  it('UIC-SPLIT-VIEW-3.4 works alone in pixels and ignores input while disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onChangeEnd = vi.fn();
    const onResizingChange = vi.fn();
    function Standalone({ isDisabled = false }: { isDisabled?: boolean }) {
      const [height, setHeight] = useState(300);
      return (
        <ResizeHandle
          orientation="horizontal"
          value={height}
          minValue={120}
          maxValue={640}
          extent={800}
          sizedPane="after"
          isDisabled={isDisabled}
          aria-label="Resize details"
          onChange={(next) => {
            onChange(next);
            setHeight(next);
          }}
          onChangeEnd={onChangeEnd}
          onResizingChange={onResizingChange}
        />
      );
    }
    const { container, rerender } = render(<Standalone />);
    const handle = screen.getByRole('separator', { name: 'Resize details' });
    handle.focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(340);
    expect(onChangeEnd).toHaveBeenLastCalledWith(340);
    pointer('pointerDown', handle, { clientY: 500 });
    expect(onResizingChange).toHaveBeenLastCalledWith(true);
    pointer('pointerMove', handle, { clientY: 450 });
    expect(handle).toHaveAttribute('aria-valuenow', '390');
    pointer('pointerUp', handle, { clientY: 450 });
    expect(onResizingChange).toHaveBeenLastCalledWith(false);
    expect(onChangeEnd).toHaveBeenLastCalledWith(390);

    rerender(<Standalone isDisabled />);
    expect(handle).not.toHaveAttribute('tabindex');
    expect(handle).toHaveAttribute('aria-disabled', 'true');
    expect(handle).toHaveAttribute('data-disabled', 'true');
    onChange.mockClear();
    act(() => handle.focus());
    expect(handle).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    pointer('pointerDown', handle, { clientY: 500 });
    pointer('pointerMove', handle, { clientY: 100 });
    expect(onChange).not.toHaveBeenCalled();
    expect(handle).not.toHaveAttribute('data-resizing');
    expectHooksMatchSpec(container, 'SPLIT-VIEW');
  });

  it('UIC-SPLIT-VIEW-3.5 appends caller classes and forwards refs and data attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const handleRef = createRef<HTMLDivElement>();
    const { container } = render(
      <>
        <SplitView
          panes={panes}
          ref={ref}
          className="caller"
          data-testid="split"
          data-orientation="sideways"
        >
          {[<p key="a">Apples</p>, <p key="b">Bananas</p>]}
        </SplitView>
        <ResizeHandle
          ref={handleRef}
          orientation="vertical"
          value={5}
          minValue={0}
          maxValue={10}
          className="handle"
          data-testid="handle"
          aria-label="Resize"
        />
      </>,
    );
    const root = container.firstElementChild!;
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('ui-split-view', 'caller');
    expect(root).toHaveAttribute('data-testid', 'split');
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
    expect(handleRef.current).toHaveClass('ui-resize-handle', 'handle');
    expect(handleRef.current).toHaveAttribute('data-testid', 'handle');
    expectHooksMatchSpec(container, 'SPLIT-VIEW');
  });
});
