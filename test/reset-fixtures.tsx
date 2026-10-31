// Shared fixtures for native form reset tests: a form that cancels its reset or lets it through.

import { act, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';

/** A form named `Pantry` with a Reset button; `cancels` makes its `onReset` cancel the reset. */
export function ResetForm({ cancels, children }: { cancels: boolean; children: ReactNode }) {
  return (
    <form
      aria-label="Pantry"
      onReset={(event) => {
        if (cancels) event.preventDefault();
      }}
    >
      {children}
      <button type="reset">Reset</button>
    </form>
  );
}

/** The entries the `Pantry` form submits. */
export function readPantry(): [string, FormDataEntryValue][] {
  return [...new FormData(screen.getByRole<HTMLFormElement>('form', { name: 'Pantry' }))];
}

/** Presses Reset and waits until every reset listener has run. */
export async function pressReset(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'Reset' }));
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}
