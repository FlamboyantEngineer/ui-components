import { act, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect } from 'vitest';
import type {
  CompletionResult,
  CompletionSource,
  Completions,
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

/**
 * Replaces a control's completions while a lookup is pending and while a list shows, and checks that
 * the new source answers instead: an answer or a list from the old source never shows or inserts,
 * while an equal inline vocabulary and the same source keep the list through a render.
 * `show(completions)` renders or rerenders the control holding `a`; `changes` are the values it
 * reported.
 */
export async function expectReplacedSourceDropsCompletions({
  show,
  changes,
}: {
  show: (completions: Completions) => void;
  changes: () => readonly string[];
}) {
  const user = userEvent.setup();
  const { source, answer } = createDeferredCompletions();
  show(source);
  await user.click(screen.getByRole('textbox'));
  await user.keyboard('{End}{Control>} {/Control}');
  show([{ label: 'alpine' }]);
  expect(await screen.findByRole('option', { name: 'alpine' })).toBeInTheDocument();
  await answer();
  expect(screen.queryByRole('option', { name: 'alpha' })).not.toBeInTheDocument();
  // The same vocabulary written again keeps the list.
  show([{ label: 'alpine' }]);
  expect(screen.getByRole('option', { name: 'alpine' })).toBeInTheDocument();

  // A source still answering hides the old list, so Enter cannot insert from it.
  show(source);
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  await user.keyboard('{Enter}');
  await user.keyboard('{End}{Control>} {/Control}');
  show(source);
  await answer();
  expect(await screen.findByRole('option', { name: 'alpha' })).toBeInTheDocument();
  expect(changes().some((value) => /alpha|alpine/.test(value))).toBe(false);
}
