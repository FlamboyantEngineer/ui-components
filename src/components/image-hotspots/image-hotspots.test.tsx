import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import {
  ImageHotspots,
  type ImageHotspotsItem,
  type ImageHotspotsProps,
} from './image-hotspots.js';

const hotspots: readonly ImageHotspotsItem[] = [
  { id: 'power', label: 'Power switch', x: 10, y: 20, width: 15, height: 10 },
  { id: 'dial', label: 'Range dial', x: 50, y: 40, width: 20, height: 30, isPressed: false },
];

function renderSurface(props: Partial<ImageHotspotsProps> = {}) {
  return render(
    <ImageHotspots
      aria-label="Front panel"
      src="/panel-a.svg"
      alt="Front panel drawing"
      width={400}
      height={200}
      hotspots={hotspots}
      {...props}
    />,
  );
}

function canvasOf(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-image-hotspots__canvas');
}

/** A caller that toggles one state from two hotspots of their own. */
function SharedState({ onAction }: { onAction: (id: Key) => void }) {
  const [isOn, setOn] = useState(false);
  return (
    <ImageHotspots
      aria-label="Panel"
      src="/panel.svg"
      alt=""
      width={100}
      height={100}
      onAction={(id) => {
        onAction(id);
        setOn((value) => !value);
      }}
      hotspots={[
        {
          id: 'lamp-front',
          label: 'Lamp, front',
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          isPressed: isOn,
        },
        {
          id: 'lamp-inset',
          label: 'Lamp, inset',
          x: 50,
          y: 50,
          width: 10,
          height: 10,
          isPressed: isOn,
        },
      ]}
    />
  );
}

describe('ImageHotspots', () => {
  it('UIC-IMAGE-HOTSPOTS-1.1 UIC-IMAGE-HOTSPOTS-1.8 renders the zoom control, a named viewport, the image and the hotspots', () => {
    const { container } = renderSurface({
      className: 'host-panel',
      id: 'panel',
      'data-lab': 'front',
      'aria-details': 'panel-notes',
    });
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-image-hotspots', 'host-panel');
    expect(root).toHaveAttribute('id', 'panel');
    expect(root).toHaveAttribute('data-lab', 'front');
    expect(root).toHaveAttribute('data-status', 'loading');
    const viewport = screen.getByRole('group', { name: 'Front panel' });
    expect(viewport).toHaveClass('ui-image-hotspots__viewport');
    expect(viewport).toHaveAttribute('tabindex', '0');
    expect(viewport).toHaveAttribute('aria-details', 'panel-notes');
    expect(root?.firstElementChild).toHaveClass('ui-image-hotspots__zoom', 'ui-zoom-control');
    const image = screen.getByRole('img', { name: 'Front panel drawing' });
    expect(image).toHaveClass('ui-image-hotspots__image');
    expect(canvasOf(container)?.firstElementChild).toBe(image);
    expect(
      screen.getAllByRole('button', { name: /switch|dial/ }).map((b) => b.textContent),
    ).toEqual(['', '']);
    expectHooksMatchSpec(container, 'IMAGE-HOTSPOTS', {
      slots: ['zoom', 'viewport', 'canvas', 'image', 'hotspot'],
      callerAttributes: ['data-lab'],
    });
  });

  it('UIC-IMAGE-HOTSPOTS-1.2 sizes the canvas from the intrinsic size and the zoom', async () => {
    const user = userEvent.setup();
    const onZoomChange = vi.fn();
    const { container } = renderSurface({ onZoomChange });
    const canvas = canvasOf(container);
    // jsdom measures no viewport, so the fit is the intrinsic size.
    expect(canvas?.style.width).toBe('400px');
    expect(canvas?.style.height).toBe('200px');
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onZoomChange).toHaveBeenLastCalledWith(125);
    expect(canvas?.style.width).toBe('500px');
    expect(canvas?.style.height).toBe('250px');
  });

  it('UIC-IMAGE-HOTSPOTS-1.2 steps the zoom with + and - inside the viewport', async () => {
    const user = userEvent.setup();
    const onZoomChange = vi.fn();
    renderSurface({ defaultZoom: 150, onZoomChange });
    screen.getByRole('group', { name: 'Front panel' }).focus();
    await user.keyboard('+');
    expect(onZoomChange).toHaveBeenLastCalledWith(200);
    await user.keyboard('-');
    await user.keyboard('-');
    expect(onZoomChange).toHaveBeenLastCalledWith(125);
    await user.keyboard('=');
    expect(onZoomChange).toHaveBeenLastCalledWith(150);
    onZoomChange.mockClear();
    await user.keyboard('{Control>}-{/Control}');
    expect(onZoomChange).not.toHaveBeenCalled();
  });

  it('UIC-IMAGE-HOTSPOTS-1.2 follows a controlled zoom and offers the reset button', async () => {
    const user = userEvent.setup();
    const onZoomChange = vi.fn();
    const { container, rerender } = renderSurface({ zoom: 200, onZoomChange, showZoomReset: true });
    expect(canvasOf(container)?.style.width).toBe('800px');
    await user.click(screen.getByRole('button', { name: 'Reset zoom' }));
    expect(onZoomChange).toHaveBeenLastCalledWith(100);
    // Controlled: nothing changes until the caller passes the new zoom.
    expect(canvasOf(container)?.style.width).toBe('800px');
    rerender(
      <ImageHotspots
        aria-label="Front panel"
        src="/panel-a.svg"
        alt="Front panel drawing"
        width={400}
        height={200}
        hotspots={hotspots}
        zoom={50}
      />,
    );
    expect(canvasOf(container)?.style.width).toBe('200px');
  });

  it('UIC-IMAGE-HOTSPOTS-1.3 places hotspots in percent of the image, clamped to it, in the given order', () => {
    renderSurface({
      hotspots: [
        ...hotspots,
        { id: 'edge', label: 'Edge port', x: 95, y: -10, width: 20, height: 15 },
      ],
    });
    const buttons = screen.getAllByRole('button', { name: /switch|dial|port/ });
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Power switch',
      'Range dial',
      'Edge port',
    ]);
    const [power, , edge] = buttons;
    expect(power?.style.position).toBe('absolute');
    expect([power?.style.left, power?.style.top, power?.style.width, power?.style.height]).toEqual([
      '10%',
      '20%',
      '15%',
      '10%',
    ]);
    expect([edge?.style.left, edge?.style.top, edge?.style.width, edge?.style.height]).toEqual([
      '95%',
      '0%',
      '5%',
      '15%',
    ]);
  });

  it('UIC-IMAGE-HOTSPOTS-1.4 dispatches only the pressed key, from a press, Enter and Space', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderSurface({ onAction });
    const power = screen.getByRole('button', { name: 'Power switch' });
    await user.click(power);
    expect(onAction).toHaveBeenLastCalledWith('power');
    expect(onAction.mock.lastCall).toHaveLength(1);
    screen.getByRole('button', { name: 'Range dial' }).focus();
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenLastCalledWith('dial');
    await user.keyboard(' ');
    expect(onAction).toHaveBeenCalledTimes(3);
    expect(power).not.toHaveAttribute('aria-pressed');
    expect(screen.getByRole('button', { name: 'Range dial' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('UIC-IMAGE-HOTSPOTS-1.4 shows one caller state on several hotspots', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { container } = render(<SharedState onAction={onAction} />);
    const front = screen.getByRole('button', { name: 'Lamp, front' });
    const inset = screen.getByRole('button', { name: 'Lamp, inset' });
    await user.click(inset);
    expect(onAction).toHaveBeenCalledWith('lamp-inset');
    expect(front).toHaveAttribute('aria-pressed', 'true');
    expect(inset).toHaveAttribute('aria-pressed', 'true');
    expect(front).toHaveAttribute('data-selected', 'true');
    expectHooksMatchSpec(container, 'IMAGE-HOTSPOTS');
    await user.click(front);
    expect(onAction).toHaveBeenLastCalledWith('lamp-front');
    expect(inset).toHaveAttribute('aria-pressed', 'false');
    expect(inset).not.toHaveAttribute('data-selected');
  });

  it('UIC-IMAGE-HOTSPOTS-1.5 UIC-IMAGE-HOTSPOTS-1.6 keeps a disabled hotspot focusable with its warning', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { container } = renderSurface({
      onAction,
      hotspots: [
        {
          id: 'fuse',
          label: 'Fuse holder',
          x: 70,
          y: 10,
          width: 10,
          height: 20,
          isDisabled: true,
          tone: 'warning',
          message: 'Fuse missing',
        },
        { id: 'blank', label: 'Blank plate', x: 0, y: 0, width: 5, height: 5, message: '  ' },
      ],
    });
    const fuse = screen.getByRole('button', { name: 'Fuse holder' });
    expect(fuse).toHaveAttribute('aria-disabled', 'true');
    expect(fuse).toHaveAttribute('data-disabled', 'true');
    expect(fuse).toHaveAttribute('data-tone', 'warning');
    expect(fuse).toHaveAccessibleDescription('Fuse missing');
    screen.getByRole('group', { name: 'Front panel' }).focus();
    await user.tab();
    expect(fuse).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.click(fuse);
    expect(onAction).not.toHaveBeenCalled();
    const message = container.querySelector<HTMLElement>('.ui-image-hotspots__message');
    expect(message).toHaveTextContent('Fuse missing');
    expect(message).toHaveAttribute('data-tone', 'warning');
    expect([message?.style.left, message?.style.top]).toEqual(['70%', '30%']);
    // A blank message shows nothing and describes nothing.
    expect(container.querySelectorAll('.ui-image-hotspots__message')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Blank plate' })).not.toHaveAttribute(
      'aria-describedby',
    );
    expectHooksMatchSpec(container, 'IMAGE-HOTSPOTS', { slots: ['hotspot', 'message'] });
  });

  it('UIC-IMAGE-HOTSPOTS-1.7 reports each new image from loading to loaded or failed', () => {
    const { container, rerender } = renderSurface();
    const root = container.firstElementChild;
    const first = screen.getByRole('img');
    fireEvent.load(first);
    expect(root).toHaveAttribute('data-status', 'loaded');
    const next = { ...hotspots[0], id: 'light', label: 'Signal light' } as ImageHotspotsItem;
    rerender(
      <ImageHotspots
        aria-label="Front panel"
        src="/panel-b.svg"
        alt="Rear panel drawing"
        width={300}
        height={300}
        hotspots={[next]}
      />,
    );
    expect(root).toHaveAttribute('data-status', 'loading');
    const second = screen.getByRole('img', { name: 'Rear panel drawing' });
    expect(second).not.toBe(first);
    expect(canvasOf(container)?.style.width).toBe('300px');
    fireEvent.error(second);
    expect(root).toHaveAttribute('data-status', 'error');
    expect(screen.getByRole('alert')).toHaveTextContent('Rear panel drawing');
    expect(screen.getByRole('button', { name: 'Signal light' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'IMAGE-HOTSPOTS', { slots: ['error'] });
  });
});
