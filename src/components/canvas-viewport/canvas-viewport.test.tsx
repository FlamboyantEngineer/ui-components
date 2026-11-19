import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  CanvasElement,
  type CanvasGesture,
  CanvasViewport,
  type CanvasViewportController,
  resolveCanvasAnchors,
  useCanvasAnchor,
  useCanvasViewport,
} from './index.js';

function drawing() {
  return screen.getByRole('group', { name: 'Drawing' });
}

function surface() {
  return requireDefined(drawing().querySelector<HTMLDivElement>('.ui-canvas-viewport__surface'));
}

function world() {
  return requireDefined(surface().querySelector<HTMLDivElement>('.ui-canvas-viewport__world'));
}

function setSurfaceBox({
  width,
  height,
  scale = 1,
}: {
  width: number;
  height: number;
  scale?: number;
}) {
  Object.defineProperties(surface(), {
    clientWidth: { configurable: true, value: width },
    clientHeight: { configurable: true, value: height },
    offsetWidth: { configurable: true, value: width },
    offsetHeight: { configurable: true, value: height },
    getBoundingClientRect: {
      configurable: true,
      value: () => new DOMRect(50, 80, width * scale, height * scale),
    },
  });
}

function Anchor({ label }: { label: string }) {
  const bindings = useCanvasAnchor('jack');
  return (
    <foreignObject width={24} height={24}>
      <button {...bindings} type="button">
        {label}
      </button>
    </foreignObject>
  );
}

function NestedAnchors() {
  return (
    <svg>
      <CanvasElement elementId="outer" position={{ x: 20, y: 30 }}>
        <CanvasElement elementId={1} position={{ x: 5, y: 11 }}>
          <Anchor label="First anchor" />
        </CanvasElement>
      </CanvasElement>
      <CanvasElement elementId="other" position={{ x: -50, y: 90 }}>
        <CanvasElement elementId="1" position={{ x: 4, y: 8 }}>
          <Anchor label="Second anchor" />
        </CanvasElement>
      </CanvasElement>
    </svg>
  );
}

function ResizeHandle({ gesture }: { gesture: CanvasGesture }) {
  const { claimGesture } = useCanvasViewport();
  return (
    <button type="button" onPointerDown={(event) => claimGesture(event, gesture)}>
      Resize
    </button>
  );
}

const mouse = { pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 1 };

it('UIC-CANVAS-VIEWPORT-1.1 UIC-CANVAS-VIEWPORT-2.2 renders the scene and leaves child controls usable', async () => {
  const user = userEvent.setup();
  const ref = createRef<HTMLDivElement>();
  const onContextMenu = vi.fn();
  const onClick = vi.fn();
  const { container } = render(
    <CanvasViewport
      ref={ref}
      id="drawing"
      className="host"
      data-purpose="editing"
      aria-label="Drawing"
      onContextMenu={onContextMenu}
      controls={
        <button type="button" onClick={onClick}>
          Fit
        </button>
      }
    >
      <NestedAnchors />
      <span>Status overlay</span>
      <button type="button" onClick={onClick}>
        Mark shape
      </button>
    </CanvasViewport>,
  );
  expectHooksMatchSpec(container, 'CANVAS-VIEWPORT', {
    slots: 'all',
    callerAttributes: ['data-purpose'],
  });
  expect(drawing()).toBe(ref.current);
  expect(drawing()).toHaveAttribute('id', 'drawing');
  expect(drawing()).toHaveAttribute('data-purpose', 'editing');
  expect(drawing()).toHaveClass('host');
  expect(world()).toContainElement(screen.getByText('Status overlay'));
  const fit = screen.getByRole('button', { name: 'Fit' });
  expect(world()).not.toContainElement(fit);
  await user.click(fit);
  const mark = screen.getByRole('button', { name: 'Mark shape' });
  await user.click(mark);
  expect(mark).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(onClick).toHaveBeenCalledTimes(3);
  await user.pointer({ keys: '[MouseRight]', target: mark });
  expect(onContextMenu).toHaveBeenCalledTimes(1);
});

it('UIC-CANVAS-VIEWPORT-1.2 UIC-CANVAS-VIEWPORT-1.3 round trips and fits the latest pane size', () => {
  const ref = createRef<CanvasViewportController>();
  const onViewportChange = vi.fn();
  render(
    <CanvasViewport
      aria-label="Drawing"
      controllerRef={ref}
      onViewportChange={onViewportChange}
      defaultViewport={{ x: 20, y: -10, zoom: 200 }}
    >
      <svg />
    </CanvasViewport>,
  );
  const camera = requireDefined(ref.current);
  expect(camera.getVisibleWorldBounds()).toBeNull();
  setSurfaceBox({ width: 400, height: 280, scale: 1.5 });
  const point = { x: 40, y: 70 };
  const client = camera.worldToClient(point);
  expect(client).toEqual({ x: 200, y: 275 });
  expect(camera.clientToWorld(client)).toEqual(point);
  expect(camera.getVisibleWorldBounds()).toEqual({ x: -10, y: 5, width: 200, height: 140 });
  fireEvent.wheel(surface(), { ctrlKey: true, deltaY: 300, clientX: client.x, clientY: client.y });
  expect(camera.getViewport().zoom).toBe(100);
  expect(camera.worldToClient(point)).toEqual(client);
  setSurfaceBox({ width: 240, height: 200 });
  act(() => camera.fitToBounds({ x: -30, y: 10, width: 500, height: 250 }, 20));
  expect(camera.getViewport()).toEqual({ x: 32, y: 46, zoom: 40 });
  expect(camera.getVisibleWorldBounds()).toEqual({ x: -80, y: -115, width: 600, height: 500 });
  expect(onViewportChange).toHaveBeenCalledTimes(2);
});

it('UIC-CANVAS-VIEWPORT-1.2 UIC-CANVAS-VIEWPORT-1.3 reports requests while following the controlled viewport', async () => {
  const user = userEvent.setup();
  const ref = createRef<CanvasViewportController>();
  const onViewportChange = vi.fn();
  const start = { x: 0, y: 0, zoom: 100 };
  const draw = (viewport: typeof start) => (
    <CanvasViewport aria-label="Drawing" controllerRef={ref} {...{ viewport, onViewportChange }}>
      <svg />
    </CanvasViewport>
  );
  const { rerender } = render(draw(start));
  const camera = requireDefined(ref.current);
  setSurfaceBox({ width: 400, height: 200 });
  await user.tab();
  expect(drawing()).toHaveFocus();
  await user.keyboard('+');
  expect(onViewportChange).toHaveBeenCalledWith({ x: -50, y: -25, zoom: 125 });
  expect(camera.getViewport()).toEqual(start);
  rerender(draw({ x: 25, y: 12, zoom: 150 }));
  expect(world()).toHaveStyle({ transform: 'translate(25px, 12px) scale(1.5)' });
  act(() => camera.zoomTo(300, { x: 70, y: 110 }));
  expect(onViewportChange).toHaveBeenLastCalledWith({ x: 30, y: -6, zoom: 300 });
});

it('UIC-CANVAS-VIEWPORT-2.1 gives the first claim priority and commits the release in world coordinates', async () => {
  const user = userEvent.setup();
  const gesture = { onPreview: vi.fn(), onCommit: vi.fn(), onCancel: vi.fn() };
  const second = { onCommit: vi.fn(), onCancel: vi.fn() };
  function Claims() {
    const { claimGesture } = useCanvasViewport();
    return (
      <div onPointerDown={(event) => expect(claimGesture(event, second)).toBe(false)}>
        <ResizeHandle gesture={gesture} />
      </div>
    );
  }
  render(
    <CanvasViewport aria-label="Drawing" defaultViewport={{ x: 10, y: 5, zoom: 200 }}>
      <Claims />
    </CanvasViewport>,
  );
  const handle = screen.getByRole('button', { name: 'Resize' });
  await user.pointer({
    keys: '[MouseLeft>]',
    target: handle,
    coords: { clientX: 30, clientY: 25 },
  });
  expect(fireEvent.dragStart(handle)).toBe(false);
  fireEvent.lostPointerCapture(handle, mouse);
  await user.pointer({ target: surface(), coords: { clientX: 50, clientY: 65 } });
  await user.pointer({
    keys: '[/MouseLeft]',
    target: surface(),
    coords: { clientX: 60, clientY: 75 },
  });
  expect(gesture.onPreview).toHaveBeenCalledWith({
    start: { x: 10, y: 10 },
    point: { x: 20, y: 30 },
    client: { x: 50, y: 65 },
  });
  expect(gesture.onCommit).toHaveBeenCalledExactlyOnceWith({
    start: { x: 10, y: 10 },
    point: { x: 25, y: 35 },
    client: { x: 60, y: 75 },
  });
  expect(gesture.onCancel).not.toHaveBeenCalled();
  expect(second.onCommit).not.toHaveBeenCalled();
  expect(world()).toHaveStyle({ transform: 'translate(10px, 5px) scale(2)' });
});

it.each(['Escape', 'pointercancel', 'lostpointercapture'] as const)(
  'UIC-CANVAS-VIEWPORT-2.1 UIC-DRAG-INTERACTIONS-1.6 clears the preview on %s',
  async (ending) => {
    const user = userEvent.setup();
    const gesture = { onPreview: vi.fn(), onCommit: vi.fn(), onCancel: vi.fn() };
    render(
      <>
        <CanvasViewport aria-label="Drawing">
          <ResizeHandle gesture={gesture} />
        </CanvasViewport>
        <button type="button">Outside</button>
      </>,
    );
    const release = vi.fn();
    Object.defineProperties(surface(), {
      setPointerCapture: { value: vi.fn() },
      hasPointerCapture: { value: () => ending !== 'lostpointercapture' },
      releasePointerCapture: { value: release },
    });
    await user.pointer({
      keys: '[MouseLeft>]',
      target: screen.getByRole('button', { name: 'Resize' }),
    });
    await user.pointer({ target: surface(), coords: { clientX: 12 } });
    if (ending === 'Escape') {
      await user.tab();
      expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
      await user.keyboard('{Escape}');
    } else fireEvent(surface(), new PointerEvent(ending, { ...mouse, bubbles: true }));
    await user.pointer({ keys: '[/MouseLeft]', target: surface() });
    expect(gesture.onPreview).toHaveBeenCalledTimes(1);
    expect(gesture.onCancel).toHaveBeenCalledTimes(1);
    expect(gesture.onCommit).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(ending === 'lostpointercapture' ? 0 : 1);
  },
);

it('UIC-CANVAS-VIEWPORT-3.1 resolves nested anchor positions after a move and size-dependent offset change', () => {
  const child = {
    id: 'child',
    position: { x: 20, y: 30 },
    anchors: [{ id: 'jack', position: { x: 35, y: -5 } }],
  };
  const parent = {
    id: 'parent',
    position: { x: 10, y: 20 },
    anchors: [{ id: 'jack', position: { x: 0, y: 8 } }],
    children: [child],
  };
  const resolve = resolveCanvasAnchors([parent]);
  expect(resolve({ elementId: 'parent', anchorId: 'jack' })).toEqual({ x: 10, y: 28 });
  expect(resolve({ elementId: 'child', anchorId: 'jack' })).toEqual({ x: 65, y: 45 });
  const changed = resolveCanvasAnchors([
    {
      ...parent,
      position: { x: -10, y: 5 },
      children: [{ ...child, anchors: [{ id: 'jack', position: { x: 45, y: -5 } }] }],
    },
  ]);
  expect(changed({ elementId: 'child', anchorId: 'jack' })).toEqual({ x: 55, y: 30 });
  expect(changed({ elementId: 'child', anchorId: 'unknown' })).toBeUndefined();
});

it('UIC-CANVAS-VIEWPORT-3.2 connects across parents by keyboard and abandons a new connection on Escape', async () => {
  const user = userEvent.setup();
  const onConnect = vi.fn();
  const onConnectionPreview = vi.fn();
  render(
    <CanvasViewport aria-label="Drawing" {...{ onConnect, onConnectionPreview }}>
      <NestedAnchors />
    </CanvasViewport>,
  );
  const first = screen.getByRole('button', { name: 'First anchor' });
  const second = screen.getByRole('button', { name: 'Second anchor' });
  await user.tab();
  await user.tab();
  expect(first).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(first).toHaveAttribute('aria-pressed', 'true');
  expect(onConnectionPreview).toHaveBeenLastCalledWith({
    source: { elementId: 1, anchorId: 'jack' },
    target: null,
    point: null,
  });
  await user.tab();
  expect(second).toHaveFocus();
  await user.keyboard(' ');
  expect(first).toHaveAttribute('aria-pressed', 'false');
  expect(onConnect).toHaveBeenCalledExactlyOnceWith({
    source: { elementId: 1, anchorId: 'jack' },
    target: { elementId: '1', anchorId: 'jack' },
  });
  await user.keyboard('{Enter}{Escape}');
  expect(second).toHaveAttribute('aria-pressed', 'false');
  expect(onConnectionPreview).toHaveBeenLastCalledWith(null);
  expect(onConnect).toHaveBeenCalledTimes(1);
});

it('UIC-CANVAS-VIEWPORT-1.4 pans 100 elements and 300 paths without rerunning their drawing', async () => {
  const user = userEvent.setup();
  const route = vi.fn((index: number) => `M 0 ${index} L 100 ${index}`);
  function Scene() {
    const camera = useCanvasViewport();
    return (
      <svg aria-label="Large drawing">
        {Array.from({ length: 300 }, (_, index) => (
          <path key={index} d={route(index)} />
        ))}
        {Array.from({ length: 100 }, (_, index) => (
          <circle key={index} cx={index} r={2} />
        ))}
        <title>{typeof camera.claimGesture}</title>
      </svg>
    );
  }
  render(
    <CanvasViewport aria-label="Drawing">
      <Scene />
    </CanvasViewport>,
  );
  const large = screen.getByLabelText('Large drawing');
  expect(route).toHaveBeenCalledTimes(300);
  await user.pointer([
    { keys: '[MouseLeft>]', target: surface(), coords: { clientX: 5, clientY: 10 } },
    { target: surface(), coords: { clientX: 15, clientY: 35 } },
    { target: surface(), coords: { clientX: 25, clientY: 50 } },
    { keys: '[/MouseLeft]', target: surface() },
  ]);
  expect(world()).toHaveStyle({ transform: 'translate(20px, 40px) scale(1)' });
  expect(screen.getByLabelText('Large drawing')).toBe(large);
  expect(route).toHaveBeenCalledTimes(300);
});

it('UIC-CANVAS-VIEWPORT-1.5 UIC-DRAG-INTERACTIONS-1.1 opts into middle-drag pan and plain-wheel zoom while primary claims still work', async () => {
  const user = userEvent.setup();
  const ref = createRef<CanvasViewportController>();
  const gesture = { onCommit: vi.fn(), onCancel: vi.fn() };
  render(
    <CanvasViewport
      aria-label="Drawing"
      controllerRef={ref}
      gesturePolicy={{ panButton: 'middle', wheel: 'zoom' }}
    >
      <ResizeHandle gesture={gesture} />
    </CanvasViewport>,
  );
  const api = requireDefined(ref.current);
  const handle = screen.getByRole('button', { name: 'Resize' });
  setSurfaceBox({ width: 400, height: 280 });
  await user.pointer([
    { keys: '[MouseLeft>]', target: surface(), coords: { clientX: 60, clientY: 90 } },
    { coords: { clientX: 95, clientY: 110 } },
    { keys: '[/MouseLeft]' },
  ]);
  expect(api.getViewport()).toEqual({ x: 0, y: 0, zoom: 100 });
  await user.pointer([
    { keys: '[MouseMiddle>]', target: handle, coords: { clientX: 60, clientY: 90 } },
    { coords: { clientX: 95, clientY: 110 } },
    { keys: '[/MouseMiddle]' },
  ]);
  expect(api.getViewport()).toEqual({ x: 35, y: 20, zoom: 100 });
  expect(gesture.onCommit).not.toHaveBeenCalled();

  const client = { x: 75, y: 120 };
  const point = api.clientToWorld(client);
  fireEvent.wheel(surface(), { deltaX: 20, clientX: client.x, clientY: client.y });
  expect(api.getViewport().zoom).toBe(100);
  fireEvent.wheel(surface(), { deltaY: -300, clientX: client.x, clientY: client.y });
  expect(api.getViewport().zoom).toBe(200);
  expect(api.worldToClient(point)).toEqual(client);

  await user.pointer({ keys: '[MouseLeft]', target: handle });
  expect(gesture.onCommit).toHaveBeenCalledTimes(1);
});

it('UIC-CANVAS-VIEWPORT-1.6 restores an exact controlled viewport and caps fit independently', () => {
  const controllerRef = createRef<CanvasViewportController>();
  const onViewportChange = vi.fn();
  const initial = { x: 5, y: 9, zoom: 100 };
  const saved = { x: -33.75, y: 41.125, zoom: 425 };
  const draw = (viewport: typeof initial) => (
    <CanvasViewport
      aria-label="Drawing"
      controllerRef={controllerRef}
      viewport={viewport}
      onViewportChange={onViewportChange}
    >
      <svg />
    </CanvasViewport>
  );
  const { rerender } = render(draw(initial));
  setSurfaceBox({ width: 400, height: 280 });
  const camera = requireDefined(controllerRef.current);
  act(() => camera.setViewport(saved));
  expect(onViewportChange).toHaveBeenLastCalledWith(saved);
  expect(camera.getViewport()).toEqual(initial);

  rerender(draw(saved));
  expect(camera.getViewport()).toEqual(saved);
  expect(world()).toHaveStyle({ transform: 'translate(-33.75px, 41.125px) scale(4.25)' });
  act(() => camera.fitToBounds({ x: 0, y: 0, width: 100, height: 100 }, { maxZoom: 80 }));
  expect(onViewportChange).toHaveBeenLastCalledWith({ x: 160, y: 100, zoom: 80 });
});

it('UIC-CANVAS-VIEWPORT-1.5 disables drag panning while plain-wheel zoom remains available', async () => {
  const user = userEvent.setup();
  const onViewportChange = vi.fn();
  render(
    <CanvasViewport
      aria-label="Drawing"
      onViewportChange={onViewportChange}
      gesturePolicy={{ panButton: 'none', wheel: 'zoom' }}
    >
      <svg />
    </CanvasViewport>,
  );
  await user.pointer([
    { keys: '[MouseLeft>]', target: surface(), coords: { clientX: 10, clientY: 10 } },
    { coords: { clientX: 20, clientY: 20 } },
    { keys: '[/MouseLeft]' },
    { keys: '[MouseMiddle>]', target: surface(), coords: { clientX: 10, clientY: 10 } },
    { coords: { clientX: 20, clientY: 20 } },
    { keys: '[/MouseMiddle]' },
  ]);
  expect(onViewportChange).not.toHaveBeenCalled();
  fireEvent.wheel(surface(), { deltaY: -300 });
  expect(onViewportChange).toHaveBeenCalledExactlyOnceWith({ x: 0, y: 0, zoom: 200 });
});

function SvgPort({ onTap, dragThreshold }: { onTap: () => void; dragThreshold: number }) {
  const bindings = useCanvasAnchor('port', { onTap, dragThreshold });
  return <circle {...bindings} role="button" tabIndex={0} aria-label="Input port" r={10} />;
}

it.each([
  { dragThreshold: 0, tapDistance: 0 },
  { dragThreshold: 6, tapDistance: 4 },
])(
  'UIC-CANVAS-VIEWPORT-3.3 handles a tap and starts a preview after $dragThreshold client pixels of movement',
  async ({ dragThreshold, tapDistance }) => {
    const user = userEvent.setup();
    const onTap = vi.fn();
    const onConnectionPreview = vi.fn();
    render(
      <CanvasViewport aria-label="Drawing" onConnectionPreview={onConnectionPreview}>
        <svg>
          <CanvasElement elementId="input" position={{ x: 0, y: 0 }}>
            <SvgPort onTap={onTap} dragThreshold={dragThreshold} />
          </CanvasElement>
        </svg>
      </CanvasViewport>,
    );
    const port = screen.getByRole('button', { name: 'Input port' });
    await user.pointer([
      { keys: '[MouseLeft>]', target: port, coords: { clientX: 10, clientY: 10 } },
      { target: surface(), coords: { clientX: 10 + tapDistance, clientY: 10 } },
      { keys: '[/MouseLeft]' },
    ]);
    expect(onTap).toHaveBeenCalledExactlyOnceWith({ elementId: 'input', anchorId: 'port' });
    expect(onConnectionPreview).not.toHaveBeenCalled();
    await user.pointer([
      { keys: '[MouseLeft>]', target: port, coords: { clientX: 10, clientY: 10 } },
      { target: surface(), coords: { clientX: 20, clientY: 10 } },
      { coords: { clientX: 10, clientY: 10 } },
    ]);
    expect(onConnectionPreview).toHaveBeenLastCalledWith({
      source: { elementId: 'input', anchorId: 'port' },
      target: null,
      point: { x: 10, y: 10 },
    });
    await user.keyboard('{Escape}');
    await user.pointer({ keys: '[/MouseLeft]', target: surface() });
    expect(onConnectionPreview).toHaveBeenLastCalledWith(null);
    expect(onTap).toHaveBeenCalledTimes(1);
  },
);
