import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button.js';

describe('Caller key handlers', () => {
  it('UIC-BUTTON-1.10 lets a key the handler does not stop go on, and stops one it stops', async () => {
    const user = userEvent.setup();
    const around = vi.fn();
    render(
      <div onKeyDown={(event) => around(event.key)}>
        <Button onKeyDown={() => undefined}>Watch</Button>
        <Button onKeyDown={(event) => event.stopPropagation()}>Stop</Button>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Watch' }));
    await user.keyboard('{Escape}');
    expect(around.mock.calls).toEqual([['Escape']]);
    await user.click(screen.getByRole('button', { name: 'Stop' }));
    await user.keyboard('{Escape}');
    expect(around).toHaveBeenCalledTimes(1);
  });
});
