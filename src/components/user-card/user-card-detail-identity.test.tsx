import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { UserCard, type UserCardDetail } from './user-card.js';

const email: UserCardDetail = {
  id: 'email',
  label: 'Email',
  value: <input aria-label="Email draft" />,
};
const note: UserCardDetail = {
  id: 'note',
  label: 'Note',
  value: <input aria-label="Note draft" />,
};
const team: UserCardDetail = { id: 'team', label: 'Team', value: 'Research' };
// Two rows may share a label; their ids still tell them apart.
const otherTeam: UserCardDetail = { id: 'team-2', label: 'Team', value: 'Design' };

function renderCard(details: readonly UserCardDetail[]) {
  return <UserCard name="Lena Ortiz" details={details} />;
}

describe('UserCard detail identity', () => {
  it('UIC-USER-CARD-1.3 keeps a value state and focus when details are reordered', async () => {
    const user = userEvent.setup();
    const { rerender } = render(renderCard([email, note]));
    await user.type(screen.getByRole('textbox', { name: 'Email draft' }), 'draft');
    rerender(renderCard([note, email]));
    const input = screen.getByRole('textbox', { name: 'Email draft' });
    expect(input).toHaveValue('draft');
    expect(input).toHaveFocus();
    const terms = Array.from(document.querySelectorAll('dt')).map((term) => term.textContent);
    expect(terms).toEqual(['Note', 'Email']);
  });

  it('UIC-USER-CARD-1.3 keeps surviving values when details are inserted or removed', async () => {
    const user = userEvent.setup();
    const { rerender } = render(renderCard([team, email, note]));
    await user.type(screen.getByRole('textbox', { name: 'Note draft' }), 'later');
    rerender(renderCard([otherTeam, team, note]));
    expect(screen.getByRole('textbox', { name: 'Note draft' })).toHaveValue('later');
    expect(screen.getByRole('textbox', { name: 'Note draft' })).toHaveFocus();
    expect(screen.queryByRole('textbox', { name: 'Email draft' })).not.toBeInTheDocument();
    rerender(renderCard([email, team, otherTeam, note]));
    expect(screen.getByRole('textbox', { name: 'Note draft' })).toHaveValue('later');
    expect(screen.getByRole('textbox', { name: 'Email draft' })).toHaveValue('');
    const values = Array.from(document.querySelectorAll('dd')).map((value) => value.textContent);
    expect(values).toEqual(['', 'Research', 'Design', '']);
  });
});
