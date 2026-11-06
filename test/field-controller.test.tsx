import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type BookingValues, ControllerForm } from '../labs/src/field-controller-cases.js';

const saved: BookingValues = {
  title: 'Quarterly review',
  seats: 12,
  room: 'north',
  dates: { start: '2026-03-02', end: '2026-03-04' },
};

function output(name: string) {
  return document.querySelector(`[data-lab-output="controller-${name}"]`);
}

async function renderLoaded(onSave = vi.fn()) {
  render(<ControllerForm loadDefaults={() => Promise.resolve(saved)} onSave={onSave} />);
  const title = screen.getByRole('textbox', { name: 'Title' });
  await waitFor(() => expect(title).toHaveValue('Quarterly review'));
  return { title, onSave };
}

describe('React Hook Form owning library fields', () => {
  it('UIC-FIELD-12.4 loads async defaults into typed text, number, select and date range fields', async () => {
    const user = userEvent.setup();
    const { title, onSave } = await renderLoaded();
    expect(title).toBeEnabled();
    expect(screen.getByRole('textbox', { name: 'Seats' })).toHaveValue('12');
    expect(screen.getByRole('button', { name: /North room/ })).toBeInTheDocument();
    expect(
      screen.getAllByRole('spinbutton', { name: /^day/ }).map((day) => day.textContent),
    ).toEqual(['2', '4']);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(saved));
    expect(output('saved')).toHaveTextContent('Quarterly review, 12 seats');
  });

  it('UIC-FIELD-12.4 shows only the controller errors and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    const { title, onSave } = await renderLoaded();
    await user.click(screen.getByRole('button', { name: 'Clear the form' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(title).toHaveFocus());
    expect(title).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText('Enter a title.')).toHaveLength(1);
    expect(screen.getByText('Book at least one seat.')).toBeInTheDocument();
    expect(screen.getByText('Choose a room.')).toBeInTheDocument();
    expect(screen.queryByText('A value is required.')).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    await user.type(title, 'Planning');
    expect(screen.queryByText('Enter a title.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Seats' })).toHaveFocus());
    await user.type(screen.getByRole('textbox', { name: 'Seats' }), '4');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Room/ })).toHaveFocus());
  });

  it('UIC-FIELD-12.4 marks a date range touched only once focus leaves the whole range', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const [startMonth] = screen.getAllByRole('spinbutton', { name: /^month/ });
    await user.click(startMonth as HTMLElement);
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getAllByRole('spinbutton', { name: /^month/ })[1]).toHaveFocus();
    expect(output('touched')).toHaveTextContent('none');
    await user.click(screen.getByRole('textbox', { name: 'Title' }));
    await waitFor(() => expect(output('touched')).toHaveTextContent('dates'));
  });

  it('UIC-FIELD-12.4 resets to the loaded values, leaving dirty state to the controller', async () => {
    const user = userEvent.setup();
    const { title } = await renderLoaded();
    await user.clear(title);
    await user.type(title, 'Planning');
    expect(output('dirty')).toHaveTextContent('true');
    expect(title.closest('.ui-field')).not.toHaveAttribute('data-dirty');
    expect(screen.queryByRole('button', { name: /^Restore/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(title).toHaveValue('Quarterly review');
    expect(output('dirty')).toHaveTextContent('false');
  });

  it('UIC-FIELD-12.4 keeps the fields disabled until the defaults load', async () => {
    let resolve: (values: BookingValues) => void = () => {};
    render(<ControllerForm loadDefaults={() => new Promise((done) => (resolve = done))} />);
    expect(screen.getByRole('textbox', { name: 'Title' })).toBeDisabled();
    expect(output('loading')).toHaveTextContent('true');
    resolve(saved);
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Title' })).toBeEnabled());
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Quarterly review');
  });
});
