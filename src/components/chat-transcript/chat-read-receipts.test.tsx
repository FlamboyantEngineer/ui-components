import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatReadReceipts } from './chat-read-receipts.js';

const readers = [
  { id: 'ana', name: 'Ana Lopez' },
  { id: 'ben', name: 'Ben Okoro' },
  { id: 'cy', name: 'Cy Park' },
  { id: 'dee', name: 'Dee Nolan' },
  { id: 'eli', name: 'Eli Brandt' },
];

describe('ChatReadReceipts', () => {
  it('UIC-CHAT-TRANSCRIPT-5.5 is named by who has seen the message', () => {
    const { container, rerender } = render(<ChatReadReceipts readers={readers} />);
    const group = screen.getByRole('group', { name: 'Seen by Ana Lopez, Ben Okoro and 3 others' });
    expect(group).toHaveClass('ui-avatar-group', 'ui-chat-read-receipts');
    expect(group).toHaveAttribute('data-size', 'xs');
    expect(container.querySelectorAll('.ui-avatar-group__avatar')).toHaveLength(3);
    expect(container.querySelector('.ui-avatar-group__overflow')).toHaveTextContent('+2');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
    rerender(<ChatReadReceipts readers={readers.slice(0, 1)} />);
    expect(screen.getByRole('group', { name: 'Seen by Ana Lopez' })).toBeInTheDocument();
    rerender(<ChatReadReceipts readers={readers.slice(0, 2)} />);
    expect(
      screen.getByRole('group', { name: 'Seen by Ana Lopez and Ben Okoro' }),
    ).toBeInTheDocument();
    rerender(<ChatReadReceipts readers={readers.slice(0, 3)} maxVisible={1} />);
    expect(
      screen.getByRole('group', { name: 'Seen by Ana Lopez, Ben Okoro and Cy Park' }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('.ui-avatar-group__avatar')).toHaveLength(1);
  });

  it('UIC-CHAT-TRANSCRIPT-5.5 lists every reader in a popover', async () => {
    const user = userEvent.setup();
    render(<ChatReadReceipts readers={readers} />);
    await user.click(screen.getByRole('button', { name: /^Ana Lopez, Ben Okoro, Cy Park/ }));
    const dialog = await screen.findByRole('dialog', { name: '5 people' });
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(5);
    expect(within(dialog).getByText('Eli Brandt')).toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'CHAT-TRANSCRIPT');
  });

  it('UIC-CHAT-TRANSCRIPT-5.6 forwards attributes to the receipts', () => {
    const { container } = render(
      <ChatReadReceipts id="r1" className="caller" data-testid="probe" readers={readers} />,
    );
    const receipts = container.querySelector('.ui-chat-read-receipts');
    expect(receipts).toHaveAttribute('id', 'r1');
    expect(receipts).toHaveClass('caller');
    expect(receipts).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { callerAttributes: ['data-testid'] });
  });
});
