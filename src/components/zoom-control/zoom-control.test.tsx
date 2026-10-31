import { MinusGlyph, PlusGlyph } from '../../core/glyphs.js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ZoomControl } from './zoom-control.js';
import { defaultZoomLevels, findNearestZoomLevelIndex, findNextZoomLevel } from './zoom-levels.js';

const levels = [50, 75, 100, 125, 150];

function slider() {
  return screen.getByRole('slider', { name: 'Zoom level' });
}

function value(container: HTMLElement) {
  return container.querySelector('.ui-zoom-control__value');
}

describe('ZoomControl', () => {
  it('UIC-ZOOM-CONTROL-1.1 orders zoom out, slider, zoom in and value in a named group', () => {
    const { container } = render(<ZoomControl levels={levels} defaultValue={100} />);
    const group = screen.getByRole('group', { name: 'Zoom' });
    expect(Array.from(group.children, (child) => child.className.split(' ').at(-1))).toEqual([
      'ui-zoom-control__zoom-out',
      'ui-zoom-control__slider',
      'ui-zoom-control__zoom-in',
      'ui-zoom-control__value',
    ]);
    const zoomOut = screen.getByRole('button', { name: 'Zoom out' });
    const zoomIn = screen.getByRole('button', { name: 'Zoom in' });
    expect(zoomOut).toHaveClass('ui-button');
    expect(zoomOut.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'minus');
    expect(zoomIn.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'plus');
    expect(value(container)).toHaveTextContent('100%');
    expectHooksMatchSpec(container, 'ZOOM-CONTROL', {
      slots: ['zoom-out', 'slider', 'zoom-in', 'value'],
    });
  });

  it('UIC-ZOOM-CONTROL-1.1 takes its group name from the caller or the provider', () => {
    const { rerender } = render(<ZoomControl aria-label="Page zoom" />);
    expect(screen.getByRole('group', { name: 'Page zoom' })).toBeInTheDocument();
    rerender(
      <>
        <span id="zoom-heading">Canvas</span>
        <ZoomControl aria-labelledby="zoom-heading" />
      </>,
    );
    expect(screen.getByRole('group', { name: 'Canvas' })).toBeInTheDocument();
    rerender(
      <UiProvider messages={{ zoom: 'Agrandissement', zoomIn: 'Agrandir' }}>
        <ZoomControl />
      </UiProvider>,
    );
    expect(screen.getByRole('group', { name: 'Agrandissement' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agrandir' })).toBeInTheDocument();
  });

  it('UIC-ZOOM-CONTROL-1.2 is uncontrolled from 100% by default and reports every request', async () => {
    const onChange = vi.fn();
    const { container } = render(<ZoomControl onChange={onChange} />);
    expect(value(container)).toHaveTextContent('100%');
    expect(slider()).toHaveAttribute('max', String(defaultZoomLevels.length - 1));
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onChange).toHaveBeenLastCalledWith(125);
    expect(value(container)).toHaveTextContent('125%');
  });

  it('UIC-ZOOM-CONTROL-1.2 follows a controlled value and sorts and deduplicates the levels', async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <ZoomControl levels={[150, 50, 100, 100, 75]} value={75} onChange={onChange} />,
    );
    expect(slider()).toHaveAttribute('max', '3');
    expect(slider()).toHaveValue('1');
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onChange).toHaveBeenLastCalledWith(100);
    expect(value(container)).toHaveTextContent('75%');
    rerender(<ZoomControl levels={[150, 50, 100, 100, 75]} value={100} onChange={onChange} />);
    expect(value(container)).toHaveTextContent('100%');
    expect(slider()).toHaveValue('2');
  });

  it('UIC-ZOOM-CONTROL-1.3 steps to the neighbouring level, also from a value between levels', async () => {
    const onChange = vi.fn();
    render(<ZoomControl levels={levels} value={137.5} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(onChange.mock.calls).toEqual([[150], [125]]);
    expect(findNextZoomLevel(levels, 100, 1)).toBe(125);
    expect(findNextZoomLevel(levels, 100, -1)).toBe(75);
    expect(findNextZoomLevel(levels, 150, 1)).toBeUndefined();
    expect(findNextZoomLevel(levels, 50, -1)).toBeUndefined();
    expect(findNextZoomLevel(levels, 10, 1)).toBe(50);
  });

  it('UIC-ZOOM-CONTROL-1.2 UIC-ZOOM-CONTROL-1.4 normalises finite levels for helpers and repeated controlled values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const unordered = [150, NaN, 50, Infinity, 100, 100, -Infinity];
    const { rerender } = render(<ZoomControl levels={unordered} value={75} onChange={onChange} />);
    // The levels 50, 100 and 150, with 75 as a stop of its own between them.
    expect(slider()).toHaveAttribute('max', '3');
    expect(slider()).toHaveValue('1');
    expect(findNearestZoomLevelIndex(unordered, 75)).toBe(0);
    expect(findNextZoomLevel(unordered, 75, 1)).toBe(100);
    expect(findNextZoomLevel(unordered, 75, -1)).toBe(50);
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onChange).toHaveBeenLastCalledWith(100);
    rerender(<ZoomControl levels={unordered} value={125} onChange={onChange} />);
    expect(slider()).toHaveValue('2');
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(onChange).toHaveBeenLastCalledWith(100);
    rerender(<ZoomControl levels={[]} value={125} />);
    expect(slider()).toHaveAttribute('max', '0');
    rerender(<ZoomControl levels={unordered} value={100} />);
    expect(slider()).toHaveAttribute('max', '2');
    expect(slider()).toHaveValue('1');
    expect(findNearestZoomLevelIndex([], 100)).toBe(0);
    expect(findNextZoomLevel([], 100, 1)).toBeUndefined();
  });

  it('UIC-ZOOM-CONTROL-1.3 disables a step at the last level but keeps it focusable', async () => {
    function Controlled() {
      const [zoom, setZoom] = useState(125);
      return <ZoomControl levels={levels} value={zoom} onChange={setZoom} />;
    }
    const { container } = render(<Controlled />);
    const zoomIn = screen.getByRole('button', { name: 'Zoom in' });
    zoomIn.focus();
    await userEvent.keyboard('{Enter}');
    expect(value(container)).toHaveTextContent('150%');
    expect(zoomIn).toHaveFocus();
    expect(zoomIn).toHaveAttribute('aria-disabled', 'true');
    expect(zoomIn).toHaveAttribute('data-disabled', 'true');
    expect(zoomIn).toBeEnabled();
    await userEvent.keyboard('{Enter}');
    expect(value(container)).toHaveTextContent('150%');
    expect(screen.getByRole('button', { name: 'Zoom out' })).not.toHaveAttribute('aria-disabled');
    expectHooksMatchSpec(container, 'ZOOM-CONTROL');

    for (const index of [0, 2, 4]) {
      const level = levels[index] as number;
      const { container: control, unmount } = render(
        <ZoomControl levels={levels} value={level} aria-label={`At ${level}`} />,
      );
      const out = control.querySelector('.ui-zoom-control__zoom-out');
      const into = control.querySelector('.ui-zoom-control__zoom-in');
      expect(out?.getAttribute('aria-disabled') === 'true').toBe(index === 0);
      expect(into?.getAttribute('aria-disabled') === 'true').toBe(index === 4);
      unmount();
    }
  });

  it('UIC-ZOOM-CONTROL-1.4 is a native range over the levels and the current value that requests the chosen level', () => {
    const onChange = vi.fn();
    render(<ZoomControl levels={levels} value={137.5} onChange={onChange} />);
    const range = slider();
    expect(range.tagName).toBe('INPUT');
    expect(range).toHaveAttribute('type', 'range');
    expect(range).toHaveAttribute('min', '0');
    // 137.5 is a stop of its own between 125 and 150.
    expect(range).toHaveAttribute('max', '5');
    expect(range).toHaveAttribute('step', '1');
    expect(range).toHaveValue('4');
    expect(range).toHaveAttribute('aria-valuetext', '137.5%');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot drag or step a native range input
    fireEvent.change(range, { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith(50);
    expect(findNearestZoomLevelIndex(levels, 87.5)).toBe(1);
    expect(findNearestZoomLevelIndex(levels, 90)).toBe(2);
    expect(findNearestZoomLevelIndex(levels, 1000)).toBe(4);
  });

  it('UIC-ZOOM-CONTROL-1.4 steps the slider from a value between levels to the neighbouring level', () => {
    const onChange = vi.fn();
    const { rerender } = render(<ZoomControl value={110} onChange={onChange} />);
    const range = slider();
    // 25, 50, 75, 100, then 110 as its own stop.
    expect(range).toHaveValue('4');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot step a native range input
    fireEvent.change(range, { target: { value: '3' } });
    expect(onChange).toHaveBeenLastCalledWith(100);
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot step a native range input
    fireEvent.change(range, { target: { value: '5' } });
    expect(onChange).toHaveBeenLastCalledWith(125);
    rerender(<ZoomControl value={90} onChange={onChange} />);
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot step a native range input
    fireEvent.change(range, { target: { value: '4' } });
    expect(onChange).toHaveBeenLastCalledWith(100);
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot drag a native range input
    fireEvent.change(range, { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith(25);
  });

  it('UIC-ZOOM-CONTROL-1.4 reaches an endpoint level one step from a value nearest it', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ZoomControl levels={[100, 125, 150]} defaultValue={110} onChange={onChange} />,
    );
    const range = slider();
    // 110 rounds to 100, the first level, yet sits one stop above it.
    expect(range).toHaveAttribute('max', '3');
    expect(range).toHaveValue('1');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot step a native range input
    fireEvent.change(range, { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith(100);
    rerender(<ZoomControl levels={[100, 125, 150]} value={140} onChange={onChange} />);
    expect(range).toHaveValue('2');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot step a native range input
    fireEvent.change(range, { target: { value: '3' } });
    expect(onChange).toHaveBeenLastCalledWith(150);
    // Past the levels, and with a single level, the value is the outer stop.
    rerender(<ZoomControl levels={[100, 125, 150]} value={180} onChange={onChange} />);
    expect(range).toHaveValue('3');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot step a native range input
    fireEvent.change(range, { target: { value: '2' } });
    expect(onChange).toHaveBeenLastCalledWith(150);
    rerender(<ZoomControl levels={[100]} value={80} onChange={onChange} />);
    expect(range).toHaveAttribute('max', '1');
    expect(range).toHaveValue('0');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot step a native range input
    fireEvent.change(range, { target: { value: '1' } });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it('UIC-ZOOM-CONTROL-1.5 shows the percentage without rounding and keeps the value node mounted', () => {
    const { container, rerender } = render(<ZoomControl levels={levels} value={0} />);
    const output = value(container);
    expect(output?.tagName).toBe('OUTPUT');
    expect(output).toHaveAttribute('for', slider().id);
    for (const [zoom, text] of [
      [0, '0%'],
      [50, '50%'],
      [137.5, '137.5%'],
      [33.333, '33.333%'],
      [1000, '1,000%'],
    ] as const) {
      rerender(<ZoomControl levels={levels} value={zoom} />);
      expect(value(container)).toBe(output);
      expect(output).toHaveTextContent(text);
    }
    rerender(<ZoomControl levels={levels} value={1000} formatOptions={{ useGrouping: false }} />);
    expect(output).toHaveTextContent('1000%');
    rerender(
      <UiProvider locale="fr-FR">
        <ZoomControl levels={levels} value={137.5} />
      </UiProvider>,
    );
    expect(value(container)?.textContent).toMatch(/^137,5\s%$/u);
  });

  it('UIC-ZOOM-CONTROL-1.6 resets to the reset value and disables reset there', async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<ZoomControl levels={levels} value={150} />);
    expect(container.querySelector('.ui-zoom-control__reset')).toBeNull();
    rerender(<ZoomControl levels={levels} value={150} resetValue={100} onChange={onChange} />);
    const reset = screen.getByRole('button', { name: 'Reset zoom' });
    expect(reset).toHaveClass('ui-button', 'ui-zoom-control__reset');
    expect(reset.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'restore');
    expect(screen.getByRole('group').lastElementChild).toBe(reset);
    await userEvent.click(reset);
    expect(onChange).toHaveBeenLastCalledWith(100);
    rerender(
      <ZoomControl
        levels={levels}
        value={100}
        resetValue={100}
        presets={[100]}
        onChange={onChange}
      />,
    );
    expect(reset).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('group').lastElementChild).toBe(reset);
    expectHooksMatchSpec(container, 'ZOOM-CONTROL', { slots: 'all' });
  });

  it('UIC-ZOOM-CONTROL-1.7 disables the slider and built-in buttons', () => {
    const { container } = render(
      <ZoomControl levels={levels} value={100} resetValue={50} isDisabled />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-disabled', 'true');
    expect(slider()).toBeDisabled();
    for (const name of ['Zoom out', 'Zoom in', 'Reset zoom']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
    expectHooksMatchSpec(container, 'ZOOM-CONTROL');
  });

  it('UIC-ZOOM-CONTROL-1.8 puts caller step buttons in the built-in positions', () => {
    const { container } = render(
      <ZoomControl
        levels={levels}
        value={100}
        zoomOutButton={<Button icon={MinusGlyph} label="Shrink" id="shrink" />}
        zoomInButton={<Button icon={PlusGlyph} label="Grow" id="grow" />}
      />,
    );
    const group = screen.getByRole('group');
    expect(Array.from(group.children, (child) => child.id || child.tagName)).toEqual([
      'shrink',
      slider().id,
      'grow',
      'OUTPUT',
    ]);
    expect(container.querySelector('.ui-zoom-control__zoom-in')).toBeNull();
    expect(value(container)).toHaveTextContent('100%');
  });

  it('UIC-ZOOM-CONTROL-1.9 publishes the size and forwards caller hooks', () => {
    const { container, rerender } = render(<ZoomControl />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-size', 'sm');
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      rerender(<ZoomControl size={size} />);
      expect(root).toHaveAttribute('data-size', size);
      expect(screen.getByRole('button', { name: 'Zoom in' })).toHaveAttribute('data-size', size);
    }
    rerender(<ZoomControl className="caller" id="zoom" data-testid="probe" data-size="huge" />);
    expect(root).toHaveClass('ui-zoom-control', 'caller');
    expect(root).toHaveAttribute('id', 'zoom');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-size', 'sm');
    expectHooksMatchSpec(container, 'ZOOM-CONTROL');
  });

  it('UIC-ZOOM-CONTROL-1.10 requests a preset percentage and reports a named preset', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onPresetAction = vi.fn();
    const { container } = render(
      <ZoomControl
        levels={[50, 100, 200]}
        resetValue={100}
        defaultValue={150}
        formatOptions={{ minimumFractionDigits: 1 }}
        presets={[{ id: 'fit-width', label: 'Fit width' }, 50, 125]}
        onChange={onChange}
        onPresetAction={onPresetAction}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Zoom presets' });
    expect(trigger).toHaveClass('ui-zoom-control__presets', 'ui-dropdown-menu', 'ui-button');
    expect(trigger).toHaveAttribute('data-size', 'sm');
    expect(trigger.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'chevron-down');
    const order = Array.from(container.querySelectorAll('.ui-zoom-control > *'), (part) =>
      [...part.classList].find((name) => name.startsWith('ui-zoom-control__')),
    );
    expect(order.slice(-3)).toEqual([
      'ui-zoom-control__value',
      'ui-zoom-control__presets',
      'ui-zoom-control__reset',
    ]);

    await user.click(trigger);
    const menu = await screen.findByRole('menu', { name: 'Zoom presets' });
    expect(
      Array.from(menu.querySelectorAll('[role="menuitem"]'), (item) => item.textContent),
    ).toEqual(['Fit width', '50.0%', '125.0%']);
    expectHooksMatchSpec(document.body, 'ZOOM-CONTROL', { slots: ['presets'] });
    await user.click(await screen.findByRole('menuitem', { name: '125.0%' }));
    expect(onChange).toHaveBeenLastCalledWith(125);
    expect(screen.getByText('125.0%', { selector: 'output' })).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.keyboard('{ArrowDown}');
    await screen.findByRole('menu');
    await user.keyboard('{Enter}');
    expect(onPresetAction).toHaveBeenCalledWith('fit-width');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-ZOOM-CONTROL-1.10 draws no preset menu without presets and disables it with the control', () => {
    const { rerender } = render(<ZoomControl presets={[]} />);
    expect(screen.queryByRole('button', { name: 'Zoom presets' })).not.toBeInTheDocument();
    rerender(
      <UiProvider messages={{ zoomPresets: 'Preset zooms' }}>
        <ZoomControl presets={[100]} size="lg" isDisabled />
      </UiProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'Preset zooms' });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('data-size', 'lg');
  });
});
