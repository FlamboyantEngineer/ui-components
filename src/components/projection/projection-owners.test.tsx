import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import {
  ProjectionContent,
  ProjectionOutlet,
  ProjectionProvider,
  useProjectedContent,
} from './projection.js';

/** One publisher: an editor whose draft is its own state. */
function Editor({ name, slot = 'tools' }: { name: string; slot?: string }) {
  return (
    <ProjectionContent slot={slot}>
      <input aria-label={`Editor ${name}`} defaultValue={name} />
    </ProjectionContent>
  );
}

interface PageProps {
  editors: readonly string[];
  outletSlot?: string;
  fallback?: boolean;
  reader?: boolean;
}

function Holder({ slot }: { slot: string }) {
  const content = useProjectedContent(slot);
  return content === undefined ? null : <div>{content}</div>;
}

function Page({ editors, outletSlot = 'tools', fallback = false, reader = false }: PageProps) {
  return (
    <ProjectionProvider>
      {reader ? (
        <Holder slot={outletSlot} />
      ) : (
        <ProjectionOutlet
          slot={outletSlot}
          fallback={fallback ? <input aria-label="Editor fallback" defaultValue="none" /> : null}
        />
      )}
      {editors.map((name) => (
        <Editor key={name} name={name} slot={name === 'S' ? 'status' : 'tools'} />
      ))}
    </ProjectionProvider>
  );
}

function editor(name: string): HTMLElement {
  return screen.getByRole('textbox', { name: `Editor ${name}` });
}

describe('Projection publisher identity', () => {
  it.each([false, true])(
    'UIC-PROJECTION-1.9 never hands one publisher state to another that takes over or yields (hook path: %s)',
    async (reader) => {
      const user = userEvent.setup();
      const { rerender } = render(<Page editors={['A']} reader={reader} />);
      await user.type(editor('A'), ' draft');
      rerender(<Page editors={['A', 'B']} reader={reader} />);
      expect(editor('B')).toHaveValue('B');
      await user.type(editor('B'), ' draft');
      rerender(<Page editors={['A']} reader={reader} />);
      // An obscured publisher remounts when restored, with only its own content.
      expect(editor('A')).toHaveValue('A');
    },
  );

  it('UIC-PROJECTION-1.9 keeps a publisher state across its own updates', async () => {
    const user = userEvent.setup();
    function Counter() {
      return (
        <ProjectionProvider>
          <ProjectionOutlet slot="tools" />
          <Updating />
        </ProjectionProvider>
      );
    }
    function Updating() {
      const [count, setCount] = useState(0);
      return (
        <ProjectionContent slot="tools">
          <input aria-label="Editor A" defaultValue="A" />
          <button type="button" onClick={() => setCount(count + 1)}>
            Updated {count}
          </button>
        </ProjectionContent>
      );
    }
    render(<Counter />);
    await user.type(editor('A'), ' draft');
    await user.click(screen.getByRole('button', { name: 'Updated 0' }));
    await user.click(screen.getByRole('button', { name: 'Updated 1' }));
    expect(editor('A')).toHaveValue('A draft');
  });

  it('UIC-PROJECTION-1.9 keeps fallback and content apart, and another slot apart', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Page editors={[]} fallback />);
    await user.type(editor('fallback'), ' draft');
    rerender(<Page editors={['A']} fallback />);
    expect(editor('A')).toHaveValue('A');
    await user.type(editor('A'), ' draft');
    rerender(<Page editors={[]} fallback />);
    expect(editor('fallback')).toHaveValue('none');
    rerender(<Page editors={['A', 'S']} fallback />);
    await user.type(editor('A'), ' draft');
    rerender(<Page editors={['A', 'S']} outletSlot="status" fallback />);
    expect(editor('S')).toHaveValue('S');
  });
});
