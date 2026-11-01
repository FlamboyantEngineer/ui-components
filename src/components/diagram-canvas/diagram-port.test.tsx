import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditableDiagram, pipeEdges, pipeNodes } from '../../../test/diagram-fixtures.js';
import { DiagramCanvas, type DiagramNode } from './diagram-canvas.js';

function Pipes({ nodes = pipeNodes, onConnect }: { nodes?: DiagramNode[]; onConnect: () => void }) {
  return (
    <DiagramCanvas
      aria-label="Pipes"
      nodes={nodes}
      edges={pipeEdges}
      defaultViewport={{ x: 0, y: 0, zoom: 100 }}
      isEditing
      onConnect={onConnect}
    />
  );
}

const status = () => document.querySelector('.ui-diagram-canvas__status');

describe('DiagramCanvas port gestures', () => {
  it('UIC-DIAGRAM-CANVAS-5.1 abandons a captured connection drag when editing stops', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    const { container, rerender } = render(<EditableDiagram onConnect={onConnect} />);
    const root = screen.getByRole('group', { name: 'Pipes' });
    const source = screen.getByRole('button', { name: 'Pump, outlet' });
    const release = vi.fn();
    Object.assign(source, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: () => true,
      releasePointerCapture: release,
    });
    await user.pointer([
      { keys: '[MouseLeft>]', target: source, coords: { clientX: 160, clientY: 24 } },
      { coords: { clientX: 220, clientY: 100 } },
    ]);
    expect(root).toHaveAttribute('data-connecting', 'true');
    expect(container.querySelector('.ui-diagram-canvas__connection-preview')).not.toBeNull();
    rerender(<EditableDiagram isEditing={false} onConnect={onConnect} />);
    expect(release).toHaveBeenCalledTimes(1);
    expect(root).not.toHaveAttribute('data-connecting');
    expect(container.querySelector('.ui-diagram-canvas__connection-preview')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pump, outlet' })).not.toBeInTheDocument();

    rerender(<EditableDiagram onConnect={onConnect} />);
    const nextSource = screen.getByRole('button', { name: 'Pump, outlet' });
    await user.pointer([
      { target: nextSource, coords: { clientX: 240, clientY: 120 } },
      { keys: '[/MouseLeft]' },
    ]);
    expect(root).not.toHaveAttribute('data-connecting');
    await user.click(screen.getByRole('group', { name: 'Tank' }));
    expect(onConnect).not.toHaveBeenCalled();

    await user.click(nextSource);
    await user.click(screen.getByRole('button', { name: 'Valve, inlet' }));
    expect(onConnect).toHaveBeenCalledExactlyOnceWith({
      source: 'pump',
      sourcePort: 'out',
      target: 'valve',
      targetPort: 'in',
    });
  });

  it.each(['pointer', 'keyboard'] as const)(
    'UIC-DIAGRAM-CANVAS-5.1 UIC-DIAGRAM-CANVAS-5.2 clears a pending %s connection when editing stops after release',
    async (input) => {
      const user = userEvent.setup();
      const onConnect = vi.fn();
      const { rerender } = render(<EditableDiagram onConnect={onConnect} />);
      const root = screen.getByRole('group', { name: 'Pipes' });
      const source = screen.getByRole('button', { name: 'Pump, outlet' });
      if (input === 'pointer') await user.click(source);
      else {
        act(() => source.focus());
        await user.keyboard('{Enter}');
      }
      expect(root).toHaveAttribute('data-connecting', 'true');
      rerender(<EditableDiagram isEditing={false} onConnect={onConnect} />);
      expect(root).not.toHaveAttribute('data-connecting');
      await user.click(screen.getByRole('group', { name: 'Tank' }));
      expect(onConnect).not.toHaveBeenCalled();
      rerender(<EditableDiagram onConnect={onConnect} />);
      const target = screen.getByRole('button', { name: 'Valve, inlet' });
      await user.click(target);
      expect(onConnect).not.toHaveBeenCalled();
      expect(target).toHaveAttribute('data-connect-source', 'true');
    },
  );

  it('UIC-DIAGRAM-CANVAS-5.1 UIC-DIAGRAM-CANVAS-5.2 gives up a keyboard connection whose source node is removed', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    const { rerender } = render(<Pipes onConnect={onConnect} />);
    const root = screen.getByRole('group', { name: 'Pipes' });
    act(() => screen.getByRole('button', { name: 'Pump, outlet' }).focus());
    await user.keyboard('{Enter}');
    expect(root).toHaveAttribute('data-connecting', 'true');
    rerender(<Pipes nodes={pipeNodes.slice(1)} onConnect={onConnect} />);
    expect(root).not.toHaveAttribute('data-connecting');
    expect(status()).toHaveTextContent('Connection cancelled');
    act(() => screen.getByRole('group', { name: 'Tank' }).focus());
    await user.keyboard('{Enter}');
    expect(onConnect).not.toHaveBeenCalled();
    act(() => screen.getByRole('button', { name: 'Valve, outlet' }).focus());
    await user.keyboard('{Enter}');
    act(() => screen.getByRole('group', { name: 'Tank' }).focus());
    await user.keyboard('{Enter}');
    expect(onConnect).toHaveBeenCalledExactlyOnceWith({
      source: 'valve',
      sourcePort: 'out',
      target: 'tank',
      targetPort: undefined,
    });
  });

  it('UIC-DIAGRAM-CANVAS-5.1 gives up a clicked connection whose source port is removed', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    const { rerender } = render(<Pipes onConnect={onConnect} />);
    const root = screen.getByRole('group', { name: 'Pipes' });
    await user.click(screen.getByRole('button', { name: 'Pump, outlet' }));
    expect(root).toHaveAttribute('data-connecting', 'true');
    const portless = pipeNodes.map((node) =>
      node.id === 'pump' ? { ...node, ports: undefined } : node,
    );
    rerender(<Pipes nodes={portless} onConnect={onConnect} />);
    expect(root).not.toHaveAttribute('data-connecting');
    expect(status()).toHaveTextContent('Connection cancelled');
    await user.click(screen.getByRole('group', { name: 'Tank' }));
    expect(onConnect).not.toHaveBeenCalled();
    const inlet = screen.getByRole('button', { name: 'Valve, inlet' });
    await user.click(inlet);
    expect(onConnect).not.toHaveBeenCalled();
    expect(inlet).toHaveAttribute('data-connect-source', 'true');
  });

  it('UIC-DIAGRAM-CANVAS-5.2 UIC-DIAGRAM-CANVAS-6.4 gives up a keyboard connection when the outline is shown', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<Pipes onConnect={onConnect} />);
    const root = screen.getByRole('group', { name: 'Pipes' });
    act(() => screen.getByRole('button', { name: 'Pump, outlet' }).focus());
    await user.keyboard('{Enter}');
    expect(root).toHaveAttribute('data-connecting', 'true');
    await user.click(screen.getByRole('radio', { name: 'Outline' }));
    expect(root).not.toHaveAttribute('data-connecting');
    expect(status()).toHaveTextContent('Connection cancelled');
    await user.click(screen.getByRole('radio', { name: 'Diagram' }));
    expect(root).not.toHaveAttribute('data-connecting');
    expect(screen.getByRole('button', { name: 'Pump, outlet' })).not.toHaveAttribute(
      'data-connect-source',
    );
    act(() => screen.getByRole('group', { name: 'Tank' }).focus());
    await user.keyboard('{Enter}');
    expect(onConnect).not.toHaveBeenCalled();
  });
});
