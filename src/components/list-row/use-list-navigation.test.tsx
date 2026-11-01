import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button } from '../button/button.js';
import { List, ListRow } from './list-row.js';

function Rows({ ids }: { ids: string[] }) {
  return (
    <List aria-label="History">
      {ids.map((id) => (
        <ListRow
          key={id}
          title={id}
          onPress={() => {}}
          trailing={<Button label={`Remove ${id}`} onPress={() => {}} />}
        />
      ))}
    </List>
  );
}

const flush = () => act(() => Promise.resolve());

describe('List window focus ownership', () => {
  it.each(['primary', 'trailing'])(
    'UIC-LIST-ROW-1.5 cancels removal recovery after window blur from a %s control',
    async (control) => {
      const user = userEvent.setup();
      const view = render(<Rows ids={['a', 'b', 'c']} />);
      await flush();
      const focused = screen.getByRole('button', {
        name: control === 'primary' ? 'b' : 'Remove b',
      });
      await user.click(focused);
      await act(async () => {
        window.dispatchEvent(new Event('blur'));
      });
      expect(focused).toHaveFocus();
      // Returning to the window alone does not give the removed row focus ownership again.
      await act(async () => {
        window.dispatchEvent(new Event('focus'));
      });
      view.rerender(<Rows ids={['a', 'c']} />);
      await flush();
      expect(document.body).toHaveFocus();
      expect(screen.getByRole('button', { name: 'c' })).toHaveAttribute('tabindex', '0');
      await user.click(screen.getByRole('button', { name: 'Remove c' }));
      view.rerender(<Rows ids={['a']} />);
      await flush();
      expect(screen.getByRole('button', { name: 'a' })).toHaveFocus();
    },
  );

  it('UIC-LIST-ROW-1.5 listens to the list owner window when rendered in another document', async () => {
    const frame = document.body.appendChild(document.createElement('iframe'));
    const owner = frame.contentDocument;
    const ownerWindow = owner?.defaultView;
    if (!owner || !ownerWindow) throw new Error('The frame has no window');
    const host = owner.body.appendChild(owner.createElement('div'));
    const view = render(<Rows ids={['a', 'b', 'c']} />, { container: host });
    const controls = within(host);
    try {
      await flush();
      act(() => controls.getByRole('button', { name: 'b' }).focus());
      await act(async () => {
        window.dispatchEvent(new Event('blur'));
      });
      view.rerender(<Rows ids={['a', 'c']} />);
      await flush();
      expect(owner.activeElement).toBe(controls.getByRole('button', { name: 'c' }));
      await act(async () => {
        ownerWindow.dispatchEvent(new ownerWindow.Event('blur'));
      });
      view.rerender(<Rows ids={['a']} />);
      await flush();
      expect(owner.activeElement).toBe(owner.body);
      expect(controls.getByRole('button', { name: 'a' })).toHaveAttribute('tabindex', '0');
    } finally {
      view.unmount();
      frame.remove();
      await act(async () => {
        window.dispatchEvent(new Event('focus'));
      });
    }
  });
});
