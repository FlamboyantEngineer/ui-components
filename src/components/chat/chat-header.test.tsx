import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ana, ben, helper } from '../../../test/chat-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { HeadingLevelContext } from '../section-header/section-header.js';
import { ChatHeader } from './chat-header.js';

describe('ChatHeader', () => {
  it('UIC-CHAT-5.2 shows one participant with their presence, the title, the line and the actions', () => {
    const { container } = render(
      <ChatHeader
        id="header"
        className="caller"
        data-testid="probe"
        title="Ana Lopez"
        participants={[ana]}
        status="Ana Lopez is typing…"
        actions={<button type="button">Mute</button>}
      />,
    );
    const root = container.querySelector('.ui-chat-header') as HTMLElement;
    expect(root).toHaveAttribute('id', 'header');
    expect(root).toHaveClass('caller');
    expect(screen.getByRole('heading', { level: 3, name: 'Ana Lopez' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Ana Lopez, Active' })).toBeVisible();
    const status = root.querySelector('.ui-chat-header__status');
    expect(status).toHaveTextContent('Ana Lopez is typing…');
    expect(status).toHaveAttribute('aria-hidden', 'true');
    expect(within(root).getByRole('button', { name: 'Mute' })).toBeVisible();
    expectHooksMatchSpec(container, 'CHAT', {
      slots: ['avatar', 'text', 'title', 'status', 'actions'].map(
        (slot) => `ui-chat-header__${slot}`,
      ),
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-CHAT-5.2 draws a participant without presence decoratively, an assistant rounded', () => {
    const { container } = render(<ChatHeader title="Trip helper" participants={[helper]} />);
    const avatar = container.querySelector('.ui-chat-header__avatar');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(avatar).toHaveAttribute('data-shape', 'rounded');
    expect(container.querySelector('.ui-chat-header__status')).toBeNull();
    expect(container.querySelector('.ui-chat-header__actions')).toBeNull();
  });

  it('UIC-CHAT-5.2 stacks several participants and lists them with their presence', async () => {
    const user = userEvent.setup();
    render(
      <HeadingLevelContext value={1}>
        <ChatHeader
          title="Team"
          participants={[
            ana,
            ben,
            { ...ben, id: 'b2', name: 'Bo' },
            { ...ben, id: 'b3', name: 'Cy' },
          ]}
        />
      </HeadingLevelContext>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Team' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Ana Lopez/ }));
    const list = await screen.findByRole('dialog');
    expect(within(list).getByText('Active')).toBeVisible();
    expect(within(list).getByText('Cy')).toBeVisible();
  });
});
