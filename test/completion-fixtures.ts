import { act, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect } from 'vitest';
import type {
  CompletionResult,
  CompletionSource,
} from '../src/components/completion-list/completion-list.js';

/** A completion source whose answers the test gives, one lookup at a time. */
export function createDeferredCompletions() {
  const pending: Array<(result: CompletionResult) => void> = [];
  const source: CompletionSource = () =>
    new Promise<CompletionResult>((resolve) => pending.push(resolve));
  /** Answers every unanswered lookup with `alpha`, shown whatever was typed. */
  const answer = () =>
    act(async () => {
      for (const resolve of pending.splice(0))
        resolve({ options: [{ label: 'alpha' }], filter: false });
    });
  return { source, answer };
}

/**
 * Replaces a control's value from outside while a lookup is pending, then while its answer shows,
 * and checks that neither answer ever reaches the new value. `show(value)` renders or rerenders the
 * control, controlled at `value`, completing from `source`; `changes` are the values it reported.
 */
export async function expectReplacedValueDropsCompletions({
  show,
  answer,
  changes,
}: {
  show: (value: string) => void;
  answer: () => Promise<void>;
  changes: () => readonly string[];
}) {
  const user = userEvent.setup();
  show('a');
  await user.click(screen.getByRole('textbox'));
  await user.keyboard('{End}{Control>} {/Control}');
  show('new document');
  await answer();
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

  await user.keyboard('{End}{Control>} {/Control}');
  await answer();
  expect(await screen.findByRole('option', { name: 'alpha' })).toBeInTheDocument();
  // Rendering the same value again keeps the list.
  show('new document');
  expect(screen.getByRole('option', { name: 'alpha' })).toBeInTheDocument();
  show('other text');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  await user.keyboard('{Enter}');
  expect(changes().some((value) => value.includes('alpha'))).toBe(false);
}
