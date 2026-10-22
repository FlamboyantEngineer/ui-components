import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent, type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { EditableDiagram, pipeEdges, pipeNodes } from '../../../test/diagram-fixtures.js';
import { DiagramCanvas } from './diagram-canvas.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

function node(name: string) {
  return screen.getByRole('group', { name });
}

function status() {
  return document.querySelector('.ui-diagram-canvas__status');
}

type Point = { clientX?: number; clientY?: number };

/** Presses the primary button on the element at a viewport point, with Shift held when asked. */
async function press(
  user: UserEvent,
  element: Element,
  { clientX = 0, clientY = 0, shiftKey = false }: Point & { shiftKey?: boolean } = {},
) {
  if (shiftKey) await user.keyboard('{Shift>}');
  await user.pointer({ keys: '[MouseLeft>]', target: element, coords: { clientX, clientY } });
  if (shiftKey) await user.keyboard('{/Shift}');
}

async function release(
  user: UserEvent,
  element: Element,
  { clientX = 0, clientY = 0 }: Point = {},
) {
  await user.pointer({ keys: '[/MouseLeft]', target: element, coords: { clientX, clientY } });
}

async function drag(
  user: UserEvent,
  element: Element,
  to: { clientX: number; clientY: number },
  shiftKey = false,
) {
  await press(user, element, { shiftKey });
  await user.pointer({ target: element, coords: to });
}

describe('DiagramCanvas nodes', () => {
  it('UIC-DIAGRAM-CANVAS-4.2 UIC-DIAGRAM-CANVAS-4.3 discards a cancelled node move and marquee', async () => {
    const user = userEvent.setup();
    const onNodesChange = vi.fn();
    const onSelectionChange = vi.fn();
    const { container } = render(
      <EditableDiagram onNodesChange={onNodesChange} onSelectionChange={onSelectionChange} />,
    );
    await drag(user, node('Pump'), { clientX: 23, clientY: 7 });
    expect(node('Pump')).toHaveAttribute('data-moving', 'true');
    fireEvent.pointerCancel(node('Pump'), { pointerId: 1 });
    await release(user, node('Pump'));
    expect(node('Pump')).not.toHaveAttribute('data-moving');
    expect(node('Pump').style).toMatchObject({ left: '0px', top: '0px' });
    expect(onNodesChange).not.toHaveBeenCalled();
    onSelectionChange.mockClear();
    const viewport = container.querySelector('.ui-diagram-canvas__viewport')!;
    await press(user, viewport, { shiftKey: true });
    await user.pointer({ target: viewport, coords: { clientX: 240, clientY: 110 } });
    expect(container.querySelector('.ui-diagram-canvas__marquee')).not.toBeNull();
    fireEvent.lostPointerCapture(viewport, { pointerId: 1 });
    await release(user, viewport);
    expect(container.querySelector('.ui-diagram-canvas__marquee')).toBeNull();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
  it('UIC-DIAGRAM-CANVAS-4.1 selects nodes and edges by press, modifier press and Space', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { container } = render(
      <DiagramCanvas nodes={pipeNodes} edges={pipeEdges} onSelectionChange={onSelectionChange} />,
    );
    await press(user, node('Pump'));
    await release(user, node('Pump'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['pump']));
    expect(node('Pump')).toHaveAttribute('data-selected', 'true');
    await press(user, node('Tank'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['pump', 'tank']));
    await press(user, container.querySelectorAll('.ui-diagram-canvas__edge-hit')[0]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['e1']));
    expect(container.querySelector('.ui-diagram-canvas__edge')).toHaveAttribute(
      'data-selected',
      'true',
    );
    expect(screen.getByText('flow')).toHaveAttribute('data-selected', 'true');
    await press(user, screen.getByText('flow'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    act(() => node('Valve').focus());
    await userEvent.keyboard(' ');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['valve']));
    await userEvent.keyboard('{Shift>} {/Shift}');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    const viewport = container.querySelector('.ui-diagram-canvas__viewport')!;
    await press(user, node('Pump'));
    await release(user, node('Pump'));
    await press(user, viewport);
    await release(user, viewport);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    expectHooksMatchSpec(container, 'DIAGRAM-CANVAS', {
      slots: ['edge-hit', 'edge-path', 'edge-arrow'],
    });
  });

  it('UIC-DIAGRAM-CANVAS-4.1 narrows a press on a selected node, and follows single, none and controlled modes', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        defaultSelectedKeys="all"
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(node('Tank')).toHaveAttribute('data-selected', 'true');
    await press(user, node('Pump'));
    expect(onSelectionChange).not.toHaveBeenCalled();
    await release(user, node('Pump'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['pump']));
    rerender(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        selectionMode="single"
        selectedKeys={['tank']}
        onSelectionChange={onSelectionChange}
      />,
    );
    await press(user, node('Pump'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['pump']));
    expect(node('Pump')).not.toHaveAttribute('data-selected');
    onSelectionChange.mockClear();
    rerender(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        selectionMode="none"
        onSelectionChange={onSelectionChange}
      />,
    );
    await press(user, node('Pump'));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('UIC-DIAGRAM-CANVAS-4.2 selects the nodes a Shift drag marquee touches', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { container } = render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        defaultViewport={{ x: 0, y: 0, zoom: 50 }}
        onSelectionChange={onSelectionChange}
      />,
    );
    const viewport = container.querySelector('.ui-diagram-canvas__viewport')!;
    await press(user, viewport, { clientX: 100, clientY: 0, shiftKey: true });
    await user.pointer({ target: viewport, coords: { clientX: 240, clientY: 110 } });
    const marquee = container.querySelector<HTMLElement>('.ui-diagram-canvas__marquee')!;
    expect(marquee.style).toMatchObject({
      left: '100px',
      top: '0px',
      width: '140px',
      height: '110px',
    });
    expectHooksMatchSpec(container, 'DIAGRAM-CANVAS', { slots: ['marquee'] });
    await release(user, viewport, { clientX: 240, clientY: 110 });
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['valve', 'tank']));
    expect(container.querySelector('.ui-diagram-canvas__marquee')).toBeNull();
  });

  it('UIC-DIAGRAM-CANVAS-4.3 drags nodes on the grid in edit mode and applies the move on release', async () => {
    const user = userEvent.setup();
    const onNodesChange = vi.fn();
    render(
      <EditableDiagram defaultSelectedKeys={['pump', 'tank']} onNodesChange={onNodesChange} />,
    );
    await drag(user, node('Pump'), { clientX: 23, clientY: 7 });
    expect(node('Pump')).toHaveAttribute('data-moving', 'true');
    expect(node('Pump').style).toMatchObject({ left: '20px', top: '10px' });
    expect(node('Tank').style).toMatchObject({ left: '320px', top: '210px' });
    expect(onNodesChange).not.toHaveBeenCalled();
    await release(user, node('Pump'));
    expect(onNodesChange).toHaveBeenCalledTimes(1);
    expect(
      onNodesChange.mock.calls[0]![0].map(({ id, x, y }: { id: string; x: number; y: number }) => [
        id,
        x,
        y,
      ]),
    ).toEqual([
      ['pump', 20, 10],
      ['valve', 300, 0],
      ['tank', 320, 210],
    ]);
    expect(node('Pump')).not.toHaveAttribute('data-moving');
    expect(status()).toHaveTextContent('2 nodes moved');
    await drag(user, node('Valve'), { clientX: 2, clientY: 1 });
    await release(user, node('Valve'));
    expect(onNodesChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-DIAGRAM-CANVAS-4.3 moves nothing outside edit mode and keeps positions off the grid with gridSize 0', async () => {
    const user = userEvent.setup();
    const onNodesChange = vi.fn();
    const { rerender } = render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        onNodesChange={onNodesChange}
        defaultViewport={{ x: 0, y: 0, zoom: 200 }}
      />,
    );
    await drag(user, node('Pump'), { clientX: 30, clientY: 30 });
    await release(user, node('Pump'));
    expect(onNodesChange).not.toHaveBeenCalled();
    rerender(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        onNodesChange={onNodesChange}
        defaultViewport={{ x: 0, y: 0, zoom: 200 }}
        isEditing
        gridSize={0}
      />,
    );
    await drag(user, node('Pump'), { clientX: 23, clientY: 7 });
    await release(user, node('Pump'));
    expect(onNodesChange.mock.calls[0]![0][0]).toMatchObject({ id: 'pump', x: 11.5, y: 3.5 });
  });

  it('UIC-DIAGRAM-CANVAS-4.4 moves a focused node by grid steps with the arrow keys', async () => {
    const onNodesChange = vi.fn();
    render(<EditableDiagram onNodesChange={onNodesChange} gridSize={20} />);
    act(() => node('Valve').focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(onNodesChange.mock.lastCall![0][1]).toMatchObject({ x: 320, y: 0 });
    expect(status()).toHaveTextContent('Valve moved');
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(onNodesChange.mock.lastCall![0][1]).toMatchObject({ x: 320, y: 100 });
    await userEvent.keyboard('{ArrowLeft}{ArrowUp}');
    expect(onNodesChange.mock.lastCall![0][1]).toMatchObject({ x: 300, y: 80 });
    expect(node('Valve')).toHaveFocus();
  });

  it('UIC-DIAGRAM-CANVAS-4.1 UIC-DIAGRAM-CANVAS-4.3 abandons a node move when editing ends while preserving viewing selection', async () => {
    const user = userEvent.setup();
    const onNodesChange = vi.fn();
    const { rerender } = render(<EditableDiagram onNodesChange={onNodesChange} />);
    await drag(user, node('Pump'), { clientX: 23, clientY: 7 });
    expect(node('Pump')).toHaveAttribute('data-moving', 'true');
    rerender(<EditableDiagram isEditing={false} onNodesChange={onNodesChange} />);
    expect(node('Pump')).not.toHaveAttribute('data-moving');
    expect(node('Pump').style).toMatchObject({ left: '0px', top: '0px' });
    await release(user, node('Pump'));
    expect(onNodesChange).not.toHaveBeenCalled();
    await user.click(node('Tank'));
    expect(node('Tank')).toHaveAttribute('data-selected', 'true');
    expect(node('Pump')).not.toHaveAttribute('data-selected');
  });

  it('UIC-DIAGRAM-CANVAS-4.3 requires a fresh node press after editing is disabled and re-enabled', async () => {
    const user = userEvent.setup();
    const onNodesChange = vi.fn();
    const { rerender } = render(<EditableDiagram onNodesChange={onNodesChange} />);
    await press(user, node('Pump'));
    rerender(<EditableDiagram isEditing={false} onNodesChange={onNodesChange} />);
    rerender(<EditableDiagram onNodesChange={onNodesChange} />);
    await user.pointer({ target: node('Pump'), coords: { clientX: 30, clientY: 0 } });
    await release(user, node('Pump'));
    expect(onNodesChange).not.toHaveBeenCalled();
    expect(node('Pump')).not.toHaveAttribute('data-moving');
    await drag(user, node('Pump'), { clientX: 23, clientY: 7 });
    await release(user, node('Pump'));
    expect(onNodesChange).toHaveBeenCalledTimes(1);
    expect(node('Pump').style).toMatchObject({ left: '20px', top: '10px' });
  });

  it('UIC-DIAGRAM-CANVAS-4.5 UIC-DIAGRAM-CANVAS-6.2 removes the focused node or the selection with their edges', async () => {
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();
    render(<EditableDiagram onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />);
    act(() => node('Valve').focus());
    await userEvent.keyboard('{Delete}');
    expect(onNodesChange).toHaveBeenLastCalledWith([pipeNodes[0], pipeNodes[2]]);
    expect(onEdgesChange).toHaveBeenLastCalledWith([]);
    expect(status()).toHaveTextContent('3 items removed');
    expect(node('Tank')).toHaveFocus();
    await userEvent.keyboard('{Backspace}');
    expect(onNodesChange).toHaveBeenLastCalledWith([pipeNodes[0]]);
    expect(status()).toHaveTextContent('1 item removed');
  });

  it('UIC-DIAGRAM-CANVAS-4.5 removes selected edges with a selected node', async () => {
    const onEdgesChange = vi.fn();
    const onNodesChange = vi.fn();
    render(
      <EditableDiagram
        defaultSelectedKeys={['tank', 'e1']}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
      />,
    );
    act(() => node('Tank').focus());
    await userEvent.keyboard('{Delete}');
    expect(onNodesChange).toHaveBeenLastCalledWith([pipeNodes[0], pipeNodes[1]]);
    expect(onEdgesChange).toHaveBeenLastCalledWith([]);
    expect(status()).toHaveTextContent('3 items removed');
  });

  it('UIC-DIAGRAM-CANVAS-5.2 UIC-DIAGRAM-CANVAS-6.2 connects a port to a node or port from the keyboard', async () => {
    const onConnect = vi.fn();
    render(<EditableDiagram onConnect={onConnect} />);
    const root = screen.getByRole('group', { name: 'Pipes' });
    const outlet = screen.getByRole('button', { name: 'Pump, outlet' });
    act(() => outlet.focus());
    await userEvent.keyboard('{Enter}');
    expect(root).toHaveAttribute('data-connecting', 'true');
    expect(outlet).toHaveAttribute('data-connect-source', 'true');
    expect(node('Pump')).toHaveAttribute('data-connect-source', 'true');
    expect(status()).toHaveTextContent(
      'Connecting from Pump, outlet. Choose a node or port and press Enter, or press Escape to cancel.',
    );
    act(() => node('Tank').focus());
    await userEvent.keyboard('{Enter}');
    expect(onConnect).toHaveBeenLastCalledWith({
      source: 'pump',
      sourcePort: 'out',
      target: 'tank',
      targetPort: undefined,
    });
    expect(status()).toHaveTextContent('Connected Pump to Tank');
    expect(root).not.toHaveAttribute('data-connecting');
    expect(node('Tank')).toHaveAccessibleDescription('Comes from Valve, Pump.');
    act(() => screen.getByRole('button', { name: 'Valve, outlet' }).focus());
    await userEvent.keyboard(' ');
    act(() => screen.getByRole('button', { name: 'Valve, inlet' }).focus());
    await userEvent.keyboard(' ');
    expect(onConnect).toHaveBeenLastCalledWith({
      source: 'valve',
      sourcePort: 'out',
      target: 'valve',
      targetPort: 'in',
    });
  });

  it('UIC-DIAGRAM-CANVAS-5.2 gives up a connection by Escape, the same port or the background', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    const { container } = render(<EditableDiagram onConnect={onConnect} />);
    const root = screen.getByRole('group', { name: 'Pipes' });
    const outlet = screen.getByRole('button', { name: 'Pump, outlet' });
    act(() => outlet.focus());
    await userEvent.keyboard('{Enter}{Escape}');
    expect(root).not.toHaveAttribute('data-connecting');
    expect(status()).toHaveTextContent('Connection cancelled');
    await userEvent.keyboard('{Enter}{Enter}');
    expect(root).not.toHaveAttribute('data-connecting');
    await userEvent.keyboard('{Enter}');
    act(() => node('Tank').focus());
    await userEvent.keyboard('{Escape}');
    expect(root).not.toHaveAttribute('data-connecting');
    await userEvent.keyboard('{Enter}');
    expect(onConnect).not.toHaveBeenCalled();
    act(() => outlet.focus());
    await userEvent.keyboard('{Enter}');
    const viewport = container.querySelector('.ui-diagram-canvas__viewport')!;
    await press(user, viewport);
    await release(user, viewport);
    expect(root).not.toHaveAttribute('data-connecting');
  });

  it('UIC-DIAGRAM-CANVAS-5.1 discards a connection preview when pointer capture is lost', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    const { container } = render(<EditableDiagram onConnect={onConnect} />);
    const outlet = screen.getByRole('button', { name: 'Pump, outlet' });
    await drag(user, outlet, { clientX: 200, clientY: 120 });
    expect(container.querySelector('.ui-diagram-canvas__connection-preview')).not.toBeNull();
    fireEvent.lostPointerCapture(outlet, { pointerId: 1 });
    await release(user, outlet);
    expect(container.querySelector('.ui-diagram-canvas__connection-preview')).toBeNull();
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('UIC-DIAGRAM-CANVAS-5.1 connects by dragging from a port to a node, with a preview edge', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    const { container } = render(<EditableDiagram onConnect={onConnect} />);
    const outlet = screen.getByRole('button', { name: 'Pump, outlet' });
    await drag(user, outlet, { clientX: 200, clientY: 120 });
    const preview = container.querySelector('.ui-diagram-canvas__connection-preview');
    expect(preview?.getAttribute('d')).toMatch(/^M 160 24 C .* 200 120$/);
    expectHooksMatchSpec(container, 'DIAGRAM-CANVAS', { slots: ['connection-preview'] });
    document.elementFromPoint = vi.fn(() => node('Tank'));
    await release(user, outlet, { clientX: 320, clientY: 220 });
    expect(onConnect).toHaveBeenCalledWith({
      source: 'pump',
      sourcePort: 'out',
      target: 'tank',
      targetPort: undefined,
    });
    expect(container.querySelector('.ui-diagram-canvas__connection-preview')).toBeNull();
    await drag(user, outlet, { clientX: 200, clientY: 120 });
    document.elementFromPoint = vi.fn(() => screen.getByRole('button', { name: 'Valve, inlet' }));
    await release(user, outlet, { clientX: 300, clientY: 24 });
    expect(onConnect).toHaveBeenLastCalledWith({
      source: 'pump',
      sourcePort: 'out',
      target: 'valve',
      targetPort: 'in',
    });
    await drag(user, outlet, { clientX: 200, clientY: 120 });
    document.elementFromPoint = vi.fn(() => null);
    await release(user, outlet, { clientX: 900, clientY: 900 });
    expect(onConnect).toHaveBeenCalledTimes(2);
    expect(status()).toHaveTextContent('Connection cancelled');
  });

  it('UIC-DIAGRAM-CANVAS-5.1 ends a connection started by a port press on the next node or port pressed', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<EditableDiagram onConnect={onConnect} />);
    const outlet = screen.getByRole('button', { name: 'Pump, outlet' });
    await press(user, outlet);
    await release(user, outlet);
    await press(user, screen.getByRole('button', { name: 'Valve, inlet' }));
    expect(onConnect).toHaveBeenLastCalledWith({
      source: 'pump',
      sourcePort: 'out',
      target: 'valve',
      targetPort: 'in',
    });
    await press(user, outlet);
    await release(user, outlet);
    await press(user, node('Tank'));
    expect(onConnect).toHaveBeenLastCalledWith({
      source: 'pump',
      sourcePort: 'out',
      target: 'tank',
      targetPort: undefined,
    });
  });

  it('UIC-DIAGRAM-CANVAS-6.3 moves focus between connected nodes with the arrow keys', async () => {
    const { rerender } = render(<DiagramCanvas nodes={pipeNodes} edges={pipeEdges} />);
    act(() => node('Pump').focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(node('Valve')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(node('Tank')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(node('Tank')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(node('Valve')).toHaveFocus();
    rerender(<DiagramCanvas nodes={pipeNodes} edges={pipeEdges} isEditing />);
    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expect(node('Pump')).toHaveFocus();
  });
});
