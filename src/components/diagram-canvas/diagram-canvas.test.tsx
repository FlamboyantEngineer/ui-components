import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  EditableDiagram,
  pipeEdges,
  pipeNodes,
  stubViewportSize,
} from '../../../test/diagram-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  DiagramCanvas,
  DiagramPaletteItem,
  routeDiagramEdge,
  type DiagramEdge,
} from './diagram-canvas.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

function node(name: string) {
  return screen.getByRole('group', { name });
}

function viewportOf(container: HTMLElement) {
  return requireDefined(container.querySelector<HTMLElement>('.ui-diagram-canvas__viewport'));
}

function contentOf(container: HTMLElement) {
  return requireDefined(container.querySelector<HTMLElement>('.ui-diagram-canvas__content'));
}

describe('DiagramCanvas', () => {
  it('UIC-DIAGRAM-CANVAS-1.1 UIC-DIAGRAM-CANVAS-1.4 renders a named group with a toolbar, viewport and status', () => {
    const { container } = render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        defaultViewport={{ x: 10, y: 20, zoom: 50 }}
        className="host"
        id="pipes"
        data-testid="pipes"
      />,
    );
    const root = screen.getByRole('group', { name: 'Diagram' });
    expect(root).toHaveClass('ui-diagram-canvas', 'host');
    expect(root).toHaveAttribute('id', 'pipes');
    expect(root).toHaveAttribute('data-testid', 'pipes');
    expect(root).toHaveAttribute('data-view', 'canvas');
    expect(root).toHaveAttribute('data-routing', 'bezier');
    expect(root).not.toHaveAttribute('data-editing');
    expect(screen.getByRole('group', { name: 'Zoom' })).toHaveClass('ui-diagram-canvas__zoom');
    expect(screen.getByRole('button', { name: 'Fit to view' })).toHaveClass(
      'ui-diagram-canvas__fit',
    );
    expect(container.querySelector('.ui-diagram-canvas__status')).toHaveAttribute('role', 'status');
    expect(contentOf(container).style.transform).toBe('translate(10px, 20px) scale(0.5)');
    expectHooksMatchSpec(container, 'DIAGRAM-CANVAS', {
      slots: [
        'toolbar',
        'zoom',
        'fit',
        'view-switch',
        'viewport',
        'content',
        'edges',
        'edge',
        'node',
      ],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-DIAGRAM-CANVAS-1.1 takes its name from the caller', () => {
    render(
      <>
        <h2 id="title">Plant</h2>
        <DiagramCanvas aria-labelledby="title" nodes={[]} edges={[]} />
      </>,
    );
    expect(screen.getByRole('group', { name: 'Plant' })).toBeInTheDocument();
  });

  it('UIC-DIAGRAM-CANVAS-1.2 UIC-DIAGRAM-CANVAS-6.1 places named, focusable nodes with descriptions', () => {
    render(<DiagramCanvas nodes={pipeNodes} edges={pipeEdges} />);
    const pump = node('Pump');
    expect(pump).toHaveClass('ui-diagram-canvas__node');
    expect(pump).toHaveAttribute('tabindex', '0');
    expect(pump).toHaveAttribute('aria-roledescription', 'node');
    expect(pump).toHaveAccessibleDescription('Leads to Valve (flow).');
    expect(node('Valve')).toHaveAccessibleDescription(
      'Open. Leads to Tank. Comes from Pump (flow).',
    );
    expect(pump.style).toMatchObject({ left: '0px', top: '0px', width: '160px', height: '48px' });
    expect(node('Tank').style).toMatchObject({
      left: '300px',
      top: '200px',
      width: '120px',
      height: '60px',
    });
    expect(within(pump).getByText('Pump')).toHaveClass('ui-diagram-canvas__node-label');
  });

  it('UIC-DIAGRAM-CANVAS-1.2 UIC-DIAGRAM-CANVAS-6.4 retains distinct numeric and text keys after reordering', async () => {
    const user = userEvent.setup();
    const nodes = [
      { id: 1, x: 0, y: 0, label: 'Numeric' },
      { id: '1', x: 200, y: 0, label: 'Text' },
    ];
    const edges = [
      { id: 3, source: 1, target: '1', label: 'Forward' },
      { id: '3', source: '1', target: 1, label: 'Back' },
    ];
    const shared = { showMinimap: false, defaultSelectedKeys: [1], onSelectionChange: vi.fn() };
    const { container, rerender } = render(
      <DiagramCanvas {...shared} nodes={nodes} edges={edges} />,
    );
    const numeric = node('Numeric');
    const text = node('Text');
    const drawn = container.querySelectorAll('.ui-diagram-canvas__edge');
    expect(numeric).toHaveAttribute('data-selected', 'true');
    expect(text).not.toHaveAttribute('data-selected');
    rerender(
      <DiagramCanvas {...shared} nodes={[...nodes].reverse()} edges={[...edges].reverse()} />,
    );
    expect(node('Numeric')).toBe(numeric);
    expect(node('Text')).toBe(text);
    expect(container.querySelectorAll('.ui-diagram-canvas__edge')[0]).toBe(drawn[1]);
    await user.click(text);
    expect(shared.onSelectionChange).toHaveBeenLastCalledWith(new Set(['1']));
    expect(numeric).not.toHaveAttribute('data-selected');
    expect(text).toHaveAttribute('data-selected', 'true');
    await user.click(screen.getByRole('radio', { name: 'Outline' }));
    const outlined = container.querySelectorAll('.ui-diagram-canvas__outline-item');
    expect(outlined[0]).toHaveTextContent('Text');
    rerender(<DiagramCanvas {...shared} nodes={nodes} edges={edges} />);
    expect(container.querySelectorAll('.ui-diagram-canvas__outline-item')[0]).toBe(outlined[1]);
  });

  it('UIC-DIAGRAM-CANVAS-1.2 draws node content with renderNode', () => {
    const renderNode = vi.fn((item, state) => (
      <strong>
        {item.label} {state.isSelected ? 'on' : 'off'} {state.isEditing ? 'edit' : 'view'}
      </strong>
    ));
    render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={[]}
        renderNode={renderNode}
        defaultSelectedKeys={['tank']}
      />,
    );
    expect(within(node('Tank')).getByText('Tank on view')).toBeInTheDocument();
    expect(within(node('Pump')).getByText('Pump off view')).toBeInTheDocument();
    expect(node('Tank')).toHaveAttribute('data-selected', 'true');
    expect(node('Tank')).toHaveAccessibleDescription('Selected.');
  });

  it('UIC-DIAGRAM-CANVAS-1.3 marks ports, and makes them named buttons in edit mode', () => {
    const { container, rerender } = render(<DiagramCanvas nodes={pipeNodes} edges={pipeEdges} />);
    const ports = container.querySelectorAll<HTMLElement>('.ui-diagram-canvas__port');
    expect(ports).toHaveLength(3);
    expect(ports[0]).toHaveAttribute('aria-hidden', 'true');
    expect(ports[0]).toHaveAttribute('data-side', 'right');
    expect(requireDefined(ports[0]).style).toMatchObject({ left: '100%', top: '50%' });
    expect(requireDefined(ports[2]).style).toMatchObject({ left: '100%', top: '25%' });
    expect(requireDefined(ports[1]).style).toMatchObject({ left: '0px', top: '50%' });
    rerender(<DiagramCanvas nodes={pipeNodes} edges={pipeEdges} isEditing />);
    expect(screen.getByRole('button', { name: 'Pump, outlet' })).toHaveClass(
      'ui-diagram-canvas__port',
    );
    expect(screen.getByRole('button', { name: 'Valve, inlet' })).toHaveAttribute(
      'data-side',
      'left',
    );
    expect(screen.getByRole('group', { name: 'Diagram' })).toHaveAttribute('data-editing', 'true');
    expectHooksMatchSpec(container, 'DIAGRAM-CANVAS', { slots: ['port', 'edge-label'] });
  });

  it('UIC-DIAGRAM-CANVAS-2.1 UIC-DIAGRAM-CANVAS-2.2 draws each edge as a routed path with an arrowhead and label', () => {
    const { container, rerender } = render(<DiagramCanvas nodes={pipeNodes} edges={pipeEdges} />);
    const edges = container.querySelectorAll('.ui-diagram-canvas__edge');
    expect(edges).toHaveLength(2);
    const expected = routeDiagramEdge({
      source: {
        rect: { x: 0, y: 0, width: 160, height: 48 },
        port: { side: 'right', position: 0.5 },
      },
      target: {
        rect: { x: 300, y: 0, width: 160, height: 48 },
        port: { side: 'left', position: 0.5 },
      },
    });
    expect(requireDefined(edges[0]).querySelector('.ui-diagram-canvas__edge-path')).toHaveAttribute(
      'd',
      expected.path,
    );
    expect(
      requireDefined(edges[0]).querySelector('.ui-diagram-canvas__edge-arrow'),
    ).toHaveAttribute('d', expected.arrow);
    expect(requireDefined(edges[0]).querySelector('.ui-diagram-canvas__edge-hit')).toHaveAttribute(
      'd',
      expected.path,
    );
    const label = screen.getByText('flow');
    expect(label).toHaveClass('ui-diagram-canvas__edge-label');
    expect(label.style).toMatchObject({
      left: `${expected.label.x}px`,
      top: `${expected.label.y}px`,
    });
    expect(container.querySelector('.ui-diagram-canvas__edges')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    rerender(<DiagramCanvas nodes={pipeNodes} edges={pipeEdges} routing="orthogonal" />);
    expect(screen.getByRole('group', { name: 'Diagram' })).toHaveAttribute(
      'data-routing',
      'orthogonal',
    );
    expect(container.querySelector('.ui-diagram-canvas__edge-path')?.getAttribute('d')).toMatch(
      /^M [\d. ]+( L [\d. ]+)+$/,
    );
    rerender(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={[...pipeEdges, { id: 'x', source: 'pump', target: 'gone' }]}
      />,
    );
    expect(container.querySelectorAll('.ui-diagram-canvas__edge')).toHaveLength(2);
  });

  it('UIC-DIAGRAM-CANVAS-3.1 pans by dragging the background and by the wheel', async () => {
    const user = userEvent.setup();
    const onViewportChange = vi.fn();
    const { container } = render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        defaultViewport={{ x: 0, y: 0, zoom: 100 }}
        onViewportChange={onViewportChange}
      />,
    );
    const viewport = viewportOf(container);
    await user.pointer([
      { keys: '[MouseLeft>]', target: viewport, coords: { clientX: 10, clientY: 10 } },
      { coords: { clientX: 40, clientY: 25 } },
      { keys: '[/MouseLeft]' },
    ]);
    expect(onViewportChange).toHaveBeenLastCalledWith({ x: 30, y: 15, zoom: 100 });
    fireEvent.wheel(viewport, { deltaX: 5, deltaY: 20 });
    expect(onViewportChange).toHaveBeenLastCalledWith({ x: 25, y: -5, zoom: 100 });
    expect(contentOf(container).style.transform).toBe('translate(25px, -5px) scale(1)');
  });

  it('UIC-DIAGRAM-CANVAS-3.1 follows a controlled viewport', () => {
    const onViewportChange = vi.fn();
    const { container } = render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        viewport={{ x: 5, y: 6, zoom: 200 }}
        onViewportChange={onViewportChange}
      />,
    );
    fireEvent.wheel(viewportOf(container), { deltaX: 0, deltaY: 10 });
    expect(onViewportChange).toHaveBeenLastCalledWith({ x: 5, y: -4, zoom: 200 });
    expect(contentOf(container).style.transform).toBe('translate(5px, 6px) scale(2)');
  });

  it('UIC-DIAGRAM-CANVAS-3.2 zooms with Ctrl and the wheel, the zoom control and the plus and minus keys', async () => {
    stubViewportSize(400, 300);
    const onViewportChange = vi.fn();
    const { container } = render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        defaultViewport={{ x: 0, y: 0, zoom: 100 }}
        onViewportChange={onViewportChange}
      />,
    );
    fireEvent.wheel(viewportOf(container), {
      deltaY: -300,
      ctrlKey: true,
      clientX: 100,
      clientY: 50,
    });
    expect(onViewportChange).toHaveBeenLastCalledWith({ x: -100, y: -50, zoom: 200 });
    await userEvent.click(screen.getByRole('button', { name: 'Reset zoom' }));
    expect(onViewportChange).toHaveBeenLastCalledWith({ x: 50, y: 50, zoom: 100 });
    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(onViewportChange).toHaveBeenLastCalledWith({ x: 12.5, y: 25, zoom: 125 });
    node('Pump').focus();
    await userEvent.keyboard('-');
    expect(onViewportChange).toHaveBeenLastCalledWith(expect.objectContaining({ zoom: 100 }));
    await userEvent.keyboard('{Shift>}+{/Shift}');
    expect(onViewportChange).toHaveBeenLastCalledWith(expect.objectContaining({ zoom: 125 }));
    fireEvent.wheel(viewportOf(container), { deltaY: 100000, metaKey: true });
    expect(onViewportChange).toHaveBeenLastCalledWith(expect.objectContaining({ zoom: 25 }));
  });

  it('UIC-DIAGRAM-CANVAS-3.3 fits every node at first and from the fit button', async () => {
    stubViewportSize(400, 300);
    const onViewportChange = vi.fn();
    const { container } = render(
      <DiagramCanvas nodes={pipeNodes} edges={pipeEdges} onViewportChange={onViewportChange} />,
    );
    // The nodes span 460 × 260 pixels; with 24 pixels around them that is 508 × 308.
    const zoom = (400 / 508) * 100;
    expect(onViewportChange).toHaveBeenCalledTimes(1);
    expect(requireDefined(onViewportChange.mock.calls[0])[0].zoom).toBeCloseTo(zoom);
    expect(contentOf(container).style.transform).toMatch(/scale\(0\.787/);
    fireEvent.wheel(viewportOf(container), { deltaY: 50 });
    await userEvent.click(screen.getByRole('button', { name: 'Fit to view' }));
    expect(requireDefined(onViewportChange.mock.lastCall)[0].zoom).toBeCloseTo(zoom);
    expect(requireDefined(onViewportChange.mock.lastCall)[0].x).toBeCloseTo(
      (400 - 508 * (zoom / 100)) / 2 + 24 * (zoom / 100),
    );
  });

  it('UIC-DIAGRAM-CANVAS-3.3 never fits above 100% and disables fit without nodes', () => {
    stubViewportSize(2000, 2000);
    const { container, rerender } = render(
      <DiagramCanvas nodes={pipeNodes.slice(0, 1)} edges={[]} />,
    );
    expect(contentOf(container).style.transform).toBe('translate(920px, 976px) scale(1)');
    rerender(<DiagramCanvas nodes={[]} edges={[]} />);
    expect(screen.getByRole('button', { name: 'Fit to view' })).toBeDisabled();
    expect(screen.getByText('No nodes')).toHaveClass('ui-diagram-canvas__empty');
  });

  it('UIC-DIAGRAM-CANVAS-3.4 pans a focused node into view', () => {
    stubViewportSize(400, 300);
    const onViewportChange = vi.fn();
    render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        defaultViewport={{ x: 0, y: 0, zoom: 100 }}
        onViewportChange={onViewportChange}
      />,
    );
    act(() => node('Tank').focus());
    expect(onViewportChange).toHaveBeenLastCalledWith({ x: -36, y: 0, zoom: 100 });
    act(() => node('Pump').focus());
    expect(onViewportChange).toHaveBeenLastCalledWith({ x: 16, y: 16, zoom: 100 });
  });

  it('UIC-DIAGRAM-CANVAS-3.5 draws a minimap of the nodes and view that centres the view where pressed', async () => {
    const user = userEvent.setup();
    stubViewportSize(400, 300);
    const onViewportChange = vi.fn();
    const { container, rerender } = render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={pipeEdges}
        defaultViewport={{ x: 0, y: 0, zoom: 100 }}
        defaultSelectedKeys={['pump']}
        onViewportChange={onViewportChange}
      />,
    );
    const minimap = requireDefined(
      container.querySelector<SVGSVGElement>('.ui-diagram-canvas__minimap'),
    );
    expect(minimap).toHaveAttribute('aria-hidden', 'true');
    expect(minimap).toHaveAttribute('viewBox', '-40 -40 540 380');
    const rects = minimap.querySelectorAll('.ui-diagram-canvas__minimap-node');
    expect(rects).toHaveLength(3);
    expect(rects[0]).toHaveAttribute('data-selected', 'true');
    const visible = requireDefined(minimap.querySelector('.ui-diagram-canvas__minimap-viewport'));
    expect(visible).toHaveAttribute('width', '400');
    vi.spyOn(minimap, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 540, 380));
    await user.pointer({
      keys: '[MouseLeft>]',
      target: minimap,
      coords: { clientX: 340, clientY: 240 },
    });
    expect(onViewportChange).toHaveBeenLastCalledWith({ x: -100, y: -50, zoom: 100 });
    await user.pointer({ target: minimap, coords: { clientX: 240, clientY: 190 } });
    expect(onViewportChange).toHaveBeenCalledTimes(2);
    await user.pointer({ keys: '[/MouseLeft]', target: minimap });
    await user.pointer({ target: minimap, coords: { clientX: 100, clientY: 100 } });
    expect(onViewportChange).toHaveBeenCalledTimes(2);
    expectHooksMatchSpec(container, 'DIAGRAM-CANVAS', {
      slots: ['minimap', 'minimap-node', 'minimap-viewport'],
    });
    rerender(<DiagramCanvas nodes={pipeNodes} edges={pipeEdges} showMinimap={false} />);
    expect(container.querySelector('.ui-diagram-canvas__minimap')).toBeNull();
  });

  it('UIC-DIAGRAM-CANVAS-6.4 switches to an outline of nodes and links that moves between entries', async () => {
    const onViewChange = vi.fn();
    const { container } = render(
      <DiagramCanvas nodes={pipeNodes} edges={pipeEdges} onViewChange={onViewChange} />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Outline' }));
    expect(onViewChange).toHaveBeenCalledWith('outline');
    expect(screen.getByRole('group', { name: 'Diagram' })).toHaveAttribute('data-view', 'outline');
    expect(container.querySelector('.ui-diagram-canvas__viewport')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Zoom' })).not.toBeInTheDocument();
    const outline = screen.getByRole('list', { name: 'Outline' });
    const items = within(outline)
      .getAllByRole('listitem')
      .filter((item) => item.parentElement === outline);
    expect(
      items.map((item) => item.querySelector('.ui-diagram-canvas__outline-label')?.textContent),
    ).toEqual(['Pump', 'Valve', 'Tank']);
    const valve = requireDefined(items[1]);
    expect(within(valve).getByRole('list', { name: 'Leads to' })).toHaveTextContent('Tank');
    expect(within(valve).getByRole('list', { name: 'Comes from' })).toHaveTextContent(
      'Pump (flow)',
    );
    await userEvent.click(
      within(requireDefined(items[0])).getByRole('button', { name: 'Valve (flow)' }),
    );
    expect(valve).toHaveFocus();
    expect(screen.queryByRole('button', { name: /Remove connection/ })).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'DIAGRAM-CANVAS', {
      slots: [
        'outline',
        'outline-item',
        'outline-label',
        'outline-links',
        'outline-links-label',
        'outline-link',
      ],
    });
  });

  it('UIC-DIAGRAM-CANVAS-6.4 removes a connection from the outline in edit mode and shows an empty outline', async () => {
    const onEdgesChange = vi.fn();
    const { rerender } = render(
      <EditableDiagram defaultView="outline" onEdgesChange={onEdgesChange} />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove connection from Pump to Valve' }),
    );
    expect(onEdgesChange).toHaveBeenCalledWith([pipeEdges[1]]);
    expect(document.querySelector('.ui-diagram-canvas__status')).toHaveTextContent(
      '1 item removed',
    );
    rerender(<DiagramCanvas nodes={[]} edges={[]} view="outline" />);
    expect(screen.getByText('No nodes')).toHaveClass('ui-diagram-canvas__empty');
  });

  it('UIC-DIAGRAM-CANVAS-6.4 keeps focus in the outline after removing a connection', async () => {
    const user = userEvent.setup();
    const fanEdges: DiagramEdge[] = [
      { id: 'e1', source: 'pump', target: 'valve' },
      { id: 'e2', source: 'pump', target: 'tank' },
    ];
    function Fan() {
      const [edges, setEdges] = useState(fanEdges);
      return (
        <DiagramCanvas
          nodes={pipeNodes}
          edges={edges}
          onEdgesChange={setEdges}
          isEditing
          defaultView="outline"
        />
      );
    }
    render(<Fan />);
    await user.click(screen.getByRole('button', { name: 'Remove connection from Pump to Valve' }));
    expect(screen.getByRole('button', { name: 'Tank' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Remove connection from Pump to Tank' }));
    const outline = screen.getByRole('list', { name: 'Outline' });
    expect(outline.querySelector('.ui-diagram-canvas__outline-item')).toHaveFocus();
    expect(screen.getByText('Pump')).toHaveClass('ui-diagram-canvas__outline-label');
  });

  it('UIC-DIAGRAM-CANVAS-5.3 adds palette items at the centre of the view in edit mode', async () => {
    stubViewportSize(400, 300);
    const onNodeAdd = vi.fn();
    const palette = (
      <>
        <DiagramPaletteItem type="valve" label="Valve" icon="plus" data-testid="valve-item" />
        <DiagramPaletteItem type="tank" label="Tank" className="host" />
      </>
    );
    const { container, rerender } = render(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={[]}
        palette={palette}
        onNodeAdd={onNodeAdd}
        defaultViewport={{ x: 3, y: 0, zoom: 100 }}
      />,
    );
    const group = screen.getByRole('group', { name: 'Palette' });
    expect(group).toHaveClass('ui-diagram-canvas__palette');
    expect(within(group).getByRole('button', { name: 'Valve' })).toBeDisabled();
    rerender(
      <DiagramCanvas
        nodes={pipeNodes}
        edges={[]}
        palette={palette}
        onNodeAdd={onNodeAdd}
        defaultViewport={{ x: 3, y: 0, zoom: 100 }}
        isEditing
      />,
    );
    const item = within(group).getByRole('button', { name: 'Valve' });
    expect(item).toHaveClass('ui-diagram-canvas__palette-item');
    expect(item).toHaveAttribute('data-testid', 'valve-item');
    expect(item.querySelector('.ui-icon')).not.toBeNull();
    expect(within(group).getByRole('button', { name: 'Tank' })).toHaveClass('host');
    await userEvent.click(item);
    expect(onNodeAdd).toHaveBeenCalledWith({ type: 'valve', x: 200, y: 150 });
    expectHooksMatchSpec(container, 'DIAGRAM-CANVAS', {
      slots: ['palette', 'palette-item'],
      callerAttributes: ['data-testid'],
    });
  });
});
