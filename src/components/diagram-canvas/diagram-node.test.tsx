import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
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

function press(
  element: Element,
  init: { clientX?: number; clientY?: number; shiftKey?: boolean } = {},
) {
  fireEvent.pointerDown(element, { button: 0, pointerId: 1, clientX: 0, clientY: 0, ...init });
}

function release(element: Element, init: { clientX?: number; clientY?: number } = {}) {
  fireEvent.pointerUp(element, { pointerId: 1, clientX: 0, clientY: 0, ...init });
}

function drag(element: Element, to: { clientX: number; clientY: number }, shiftKey = false) {
  press(element, { shiftKey });
  fireEvent.pointerMove(element, { pointerId: 1, ...to });
}

describe('DiagramCanvas nodes', () => {
  it('UIC-DIAGRAM-CANVAS-4.1 selects nodes and edges by press, modifier press and Space', async () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <DiagramCanvas nodes={pipeNodes} edges={pipeEdges} onSelectionChange={onSelectionChange} />,
    );
    press(node('Pump'));
    release(node('Pump'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['pump']));
    expect(node('Pump')).toHaveAttribute('data-selected', 'true');
    press(node('Tank'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['pump', 'tank']));
    press(container.querySelectorAll('.ui-diagram-canvas__edge-hit')[0]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['e1']));
    expect(container.querySelector('.ui-diagram-canvas__edge')).toHaveAttribute(
      'data-selected',
      'true',
    );
    expect(screen.getByText('flow')).toHaveAttribute('data-selected', 'true');
    press(screen.getByText('flow'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    act(() => node('Valve').focus());
    await userEvent.keyboard(' ');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['valve']));
    await userEvent.keyboard('{Shift>} {/Shift}');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    const viewport = container.querySelector('.ui-diagram-canvas__viewport')!;
    press(node('Pump'));
    release(node('Pump'));
    press(viewport);
    release(viewport);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    expectHooksMatchSpec(container, 'DIAGRAM-CANVAS', {
      slots: ['edge-hit', 'edge-path', 'edge-arrow'],
    });
  });

  it('UIC-DIAGRAM-CANVAS-4.1 narrows a press on a selected node, and follows single, none and controlled modes', () => {
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
    press(node('Pump'));
    expect(onSelectionChange).not.toHaveBeenCalled();
    release(node('Pump'));
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
    press(node('Pump'), { shiftKey: true });
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
    press(node('Pump'));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('UIC-DIAGRAM-CANVAS-4.2 selects the nodes a Shift drag marquee touches', () => {
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
    press(viewport, { clientX: 100, clientY: 0, shiftKey: true });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 240, clientY: 110 });
    const marquee = container.querySelector<HTMLElement>('.ui-diagram-canvas__marquee')!;
    expect(marquee.style).toMatchObject({
      left: '100px',
      top: '0px',
      width: '140px',
      height: '110px',
    });
    expectHooksMatchSpec(container, 'DIAGRAM-CANVAS', { slots: ['marquee'] });
    release(viewport, { clientX: 240, clientY: 110 });
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['valve', 'tank']));
    expect(container.querySelector('.ui-diagram-canvas__marquee')).toBeNull();
  });

  it('UIC-DIAGRAM-CANVAS-4.3 drags nodes on the grid in edit mode and applies the move on release', () => {
    const onNodesChange = vi.fn();
    render(
      <EditableDiagram defaultSelectedKeys={['pump', 'tank']} onNodesChange={onNodesChange} />,
    );
    drag(node('Pump'), { clientX: 23, clientY: 7 });
    expect(node('Pump')).toHaveAttribute('data-moving', 'true');
    expect(node('Pump').style).toMatchObject({ left: '20px', top: '10px' });
    expect(node('Tank').style).toMatchObject({ left: '320px', top: '210px' });
    expect(onNodesChange).not.toHaveBeenCalled();
    release(node('Pump'));
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
    drag(node('Valve'), { clientX: 2, clientY: 1 });
    release(node('Valve'));
    expect(onNodesChange).toHaveBeenCalledTimes(1);
  });

  it('UIC-DIAGRAM-CANVAS-4.3 moves nothing outside edit mode and keeps positions off the grid with gridSize 0', () => {
    const onNodesChange = vi.fn();
    const { rerender } = render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        onNodesChange={onNodesChange}
        defaultViewport={{ x: 0, y: 0, zoom: 200 }}
      />,
    );
    drag(node('Pump'), { clientX: 30, clientY: 30 });
    release(node('Pump'));
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
    drag(node('Pump'), { clientX: 23, clientY: 7 });
    release(node('Pump'));
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
    press(viewport);
    release(viewport);
    expect(root).not.toHaveAttribute('data-connecting');
  });

  it('UIC-DIAGRAM-CANVAS-5.1 connects by dragging from a port to a node, with a preview edge', () => {
    const onConnect = vi.fn();
    const { container } = render(<EditableDiagram onConnect={onConnect} />);
    const outlet = screen.getByRole('button', { name: 'Pump, outlet' });
    drag(outlet, { clientX: 200, clientY: 120 });
    const preview = container.querySelector('.ui-diagram-canvas__connection-preview');
    expect(preview?.getAttribute('d')).toMatch(/^M 160 24 C .* 200 120$/);
    expectHooksMatchSpec(container, 'DIAGRAM-CANVAS', { slots: ['connection-preview'] });
    document.elementFromPoint = vi.fn(() => node('Tank'));
    release(outlet, { clientX: 320, clientY: 220 });
    expect(onConnect).toHaveBeenCalledWith({
      source: 'pump',
      sourcePort: 'out',
      target: 'tank',
      targetPort: undefined,
    });
    expect(container.querySelector('.ui-diagram-canvas__connection-preview')).toBeNull();
    drag(outlet, { clientX: 200, clientY: 120 });
    document.elementFromPoint = vi.fn(() => screen.getByRole('button', { name: 'Valve, inlet' }));
    release(outlet, { clientX: 300, clientY: 24 });
    expect(onConnect).toHaveBeenLastCalledWith({
      source: 'pump',
      sourcePort: 'out',
      target: 'valve',
      targetPort: 'in',
    });
    drag(outlet, { clientX: 200, clientY: 120 });
    document.elementFromPoint = vi.fn(() => null);
    release(outlet, { clientX: 900, clientY: 900 });
    expect(onConnect).toHaveBeenCalledTimes(2);
    expect(status()).toHaveTextContent('Connection cancelled');
  });

  it('UIC-DIAGRAM-CANVAS-5.1 ends a connection started by a port press on the next node or port pressed', () => {
    const onConnect = vi.fn();
    render(<EditableDiagram onConnect={onConnect} />);
    const outlet = screen.getByRole('button', { name: 'Pump, outlet' });
    press(outlet);
    release(outlet);
    press(screen.getByRole('button', { name: 'Valve, inlet' }));
    expect(onConnect).toHaveBeenLastCalledWith({
      source: 'pump',
      sourcePort: 'out',
      target: 'valve',
      targetPort: 'in',
    });
    press(outlet);
    release(outlet);
    press(node('Tank'));
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
