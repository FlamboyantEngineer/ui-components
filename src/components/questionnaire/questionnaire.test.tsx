import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from './index.js';

const items = ['crossing', 'extras', 'note'];

/** A question's fieldset, which comes before the checkbox group it names. */
function question(name: string): HTMLElement {
  const [fieldset] = screen.getAllByRole('group', { name });
  if (!fieldset) throw new Error(`No question named ${name}`);
  return fieldset;
}

function Trip({
  stepped = true,
  onSubmit,
  currentKey,
  onCurrentKeyChange,
}: {
  stepped?: boolean;
  onSubmit?: (answers: Record<string, string[]>) => void;
  currentKey?: string;
  onCurrentKeyChange?: (key: string) => void;
}): ReactNode {
  return (
    <Questionnaire
      aria-label="Trip"
      items={stepped ? items : undefined}
      currentKey={currentKey}
      onCurrentKeyChange={onCurrentKeyChange}
      onSubmit={onSubmit}
    >
      <QuestionnaireProgress />
      <QuestionnaireItem name="crossing" isRequired>
        <QuestionnaireTitle>Which crossing?</QuestionnaireTitle>
        <QuestionnaireDescription>Both reach the island.</QuestionnaireDescription>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="ferry" description="Hourly from the quay">
            Ferry
          </QuestionnaireChoice>
          <QuestionnaireChoice value="bridge">Bridge</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError />
      </QuestionnaireItem>
      <QuestionnaireItem name="extras">
        <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
        <QuestionnaireChoices selectionMode="multiple">
          <QuestionnaireChoice value="bike">Bike</QuestionnaireChoice>
          <QuestionnaireChoice value="lunch">Lunch</QuestionnaireChoice>
          <QuestionnaireChoice value="cabin" isDisabled>
            Cabin
          </QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="note" isRequired>
        <QuestionnaireTitle>A note for the crew</QuestionnaireTitle>
        <QuestionnaireInput placeholder="Your note" />
        <QuestionnaireError>Write a note first.</QuestionnaireError>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireSkip />
        <QuestionnaireNext />
        <QuestionnaireSubmit />
      </QuestionnaireActions>
    </Questionnaire>
  );
}

it('UIC-QUESTIONNAIRE-1.1 shows every question as a named, described group without items', () => {
  const { container } = render(<Trip stepped={false} />);
  const form = screen.getByRole('form', { name: 'Trip' });
  expect(form).toHaveAttribute('novalidate');
  expect(form).not.toHaveAttribute('data-stepping');
  const crossing = screen.getByRole('group', { name: 'Which crossing?' });
  expect(crossing).toHaveAccessibleDescription('Both reach the island.');
  expect(crossing).toHaveAttribute('data-required', 'true');
  expect(crossing).toHaveAttribute('data-status', 'unanswered');
  expect(question('Anything else?')).toBeVisible();
  expect(screen.getByRole('textbox', { name: 'A note for the crew' })).toBeVisible();
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('type', 'submit');
  expectHooksMatchSpec(container, 'QUESTIONNAIRE', {
    slots: ['item', 'title', 'description', 'choices', 'choice', 'input', 'actions', 'submit'],
  });
});

it('UIC-QUESTIONNAIRE-1.2 steps through the items one at a time with its progress', async () => {
  const user = userEvent.setup();
  const { container } = render(<Trip />);
  expect(screen.getByRole('form', { name: 'Trip' })).toHaveAttribute('data-stepping', 'true');
  const progress = screen.getByRole('progressbar', { name: 'Questions' });
  expect(progress).toHaveTextContent('Question 1 of 3');
  expect(progress).toHaveAttribute('aria-valuenow', '1');
  expect(progress).toHaveAttribute('aria-valuemax', '3');
  const crossing = screen.getByRole('group', { name: 'Which crossing?' });
  expect(crossing).toHaveAttribute('data-current', 'true');
  expect(screen.queryAllByRole('group', { name: 'Anything else?' })).toEqual([]);
  expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: 'Ferry' }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  const extras = question('Anything else?');
  expect(crossing).not.toBeVisible();
  expect(progress).toHaveTextContent('Question 2 of 3');
  await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Bike' })).toHaveFocus());
  await user.click(screen.getByRole('button', { name: 'Previous' }));
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Ferry' })).toHaveFocus());
  expect(extras).not.toBeVisible();
  expectHooksMatchSpec(container, 'QUESTIONNAIRE', {
    slots: ['progress', 'item', 'title', 'choices', 'choice', 'actions', 'next'],
  });
});

it('UIC-QUESTIONNAIRE-1.2 follows a controlled current question', async () => {
  const user = userEvent.setup();
  const onCurrentKeyChange = vi.fn();
  render(<Trip currentKey="extras" onCurrentKeyChange={onCurrentKeyChange} />);
  expect(question('Anything else?')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Previous' }));
  expect(onCurrentKeyChange).toHaveBeenCalledWith('crossing');
  expect(question('Anything else?')).toBeVisible();
});

it('UIC-QUESTIONNAIRE-1.3 answers with one radio, any checkboxes or the reader’s words', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<Trip stepped={false} onSubmit={onSubmit} />);
  const ferry = screen.getByRole('radio', { name: 'Ferry' });
  expect(ferry).toHaveAccessibleDescription('Hourly from the quay');
  expect(screen.getByRole('radiogroup', { name: 'Which crossing?' })).toBeInTheDocument();
  await user.click(ferry);
  await user.click(screen.getByRole('radio', { name: 'Bridge' }));
  expect(ferry).not.toBeChecked();
  const choice = (name: string) => screen.getByText(name).closest('.ui-questionnaire__choice');
  expect(choice('Bridge')).toHaveAttribute('data-selected', 'true');
  expect(choice('Ferry')).not.toHaveAttribute('data-selected');
  const extras = question('Anything else?');
  await user.click(within(extras).getByRole('checkbox', { name: 'Bike' }));
  await user.click(within(extras).getByRole('checkbox', { name: 'Lunch' }));
  expect(within(extras).getByRole('checkbox', { name: 'Cabin' })).toBeDisabled();
  expect(extras).toHaveAttribute('data-status', 'answered');
  await user.type(screen.getByRole('textbox', { name: 'A note for the crew' }), 'Window seat');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  expect(onSubmit).toHaveBeenCalledWith({
    crossing: ['bridge'],
    extras: ['bike', 'lunch'],
    note: ['Window seat'],
  });
});

it('UIC-QUESTIONNAIRE-1.3 reports controlled choices and text', async () => {
  const user = userEvent.setup();
  const onChoices = vi.fn();
  const onText = vi.fn();
  render(
    <Questionnaire aria-label="Controlled">
      <QuestionnaireItem name="crossing">
        <QuestionnaireTitle>Which crossing?</QuestionnaireTitle>
        <QuestionnaireChoices value={['ferry']} onChange={onChoices}>
          <QuestionnaireChoice value="ferry">Ferry</QuestionnaireChoice>
          <QuestionnaireChoice value="bridge">Bridge</QuestionnaireChoice>
        </QuestionnaireChoices>
      </QuestionnaireItem>
      <QuestionnaireItem name="note" isDisabled>
        <QuestionnaireTitle>Note</QuestionnaireTitle>
        <QuestionnaireInput aria-label="Crew note" type="email" value="ada@example.com" />
      </QuestionnaireItem>
      <QuestionnaireItem name="seat">
        <QuestionnaireTitle>Seat</QuestionnaireTitle>
        <QuestionnaireInput defaultValue="12" onChange={onText} />
      </QuestionnaireItem>
    </Questionnaire>,
  );
  expect(screen.getByRole('radio', { name: 'Ferry' })).toBeChecked();
  await user.click(screen.getByRole('radio', { name: 'Bridge' }));
  expect(onChoices).toHaveBeenCalledWith(['bridge']);
  expect(screen.getByRole('radio', { name: 'Ferry' })).toBeChecked();
  const note = screen.getByRole('textbox', { name: 'Crew note' });
  expect(note).toHaveAttribute('type', 'email');
  expect(note).toBeDisabled();
  expect(screen.getByRole('group', { name: 'Note' })).toHaveAttribute('data-disabled', 'true');
  await user.type(screen.getByRole('textbox', { name: 'Seat' }), 'A');
  expect(onText).toHaveBeenLastCalledWith('12A');
  expect(screen.getByRole('group', { name: 'Seat' })).toHaveAttribute('data-status', 'answered');
});

it('UIC-QUESTIONNAIRE-2.1 skips an optional question and keeps a required one', async () => {
  const user = userEvent.setup();
  render(<Trip />);
  expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: 'Ferry' }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  const extras = question('Anything else?');
  await user.click(screen.getByRole('button', { name: 'Skip' }));
  expect(extras).toHaveAttribute('data-status', 'skipped');
  expect(screen.getByRole('group', { name: 'A note for the crew' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Submit' })).toBeVisible();
});

it('UIC-QUESTIONNAIRE-2.2 stops Next at a required question until it has an answer', async () => {
  const user = userEvent.setup();
  const { container } = render(<Trip />);
  const crossing = screen.getByRole('group', { name: 'Which crossing?' });
  await user.click(screen.getByRole('button', { name: 'Next' }));
  expect(crossing).toBeVisible();
  expect(crossing).toHaveAttribute('data-invalid', 'true');
  expect(crossing).toHaveAccessibleDescription(
    'Both reach the island. Answer this question to continue.',
  );
  expect(screen.getByRole('radio', { name: 'Ferry' })).toHaveFocus();
  expectHooksMatchSpec(container, 'QUESTIONNAIRE', { slots: ['error'] });
  await user.click(screen.getByRole('radio', { name: 'Bridge' }));
  expect(crossing).not.toHaveAttribute('data-invalid');
  expect(container.querySelector('.ui-questionnaire__error')).toBeNull();
  expect(crossing).toHaveAccessibleDescription('Both reach the island.');
});

it('UIC-QUESTIONNAIRE-2.3 submits from the last question, or returns to the first unanswered', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<Trip onSubmit={onSubmit} />);
  await user.click(screen.getByRole('radio', { name: 'Ferry' }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  const note = screen.getByRole('textbox', { name: 'A note for the crew' });
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByRole('group', { name: 'A note for the crew' })).toHaveAccessibleDescription(
    'Write a note first.',
  );
  await user.type(note, 'Window seat{Enter}');
  expect(onSubmit).toHaveBeenCalledWith({ crossing: ['ferry'], extras: [], note: ['Window seat'] });
});

it('UIC-QUESTIONNAIRE-2.3 moves on with Enter in an input before the last question', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(
    <Questionnaire aria-label="Two" items={['name', 'seat']} onSubmit={onSubmit}>
      <QuestionnaireItem name="name" isRequired>
        <QuestionnaireTitle>Name</QuestionnaireTitle>
        <QuestionnaireInput />
      </QuestionnaireItem>
      <QuestionnaireItem name="seat">
        <QuestionnaireTitle>Seat</QuestionnaireTitle>
        <QuestionnaireInput />
      </QuestionnaireItem>
    </Questionnaire>,
  );
  const name = screen.getByRole('textbox', { name: 'Name' });
  await user.type(name, '{Enter}');
  expect(name).toBeVisible();
  expect(name).toHaveAttribute('aria-invalid', 'true');
  await user.type(name, 'Ada{Enter}');
  const seat = screen.getByRole('textbox', { name: 'Seat' });
  await waitFor(() => expect(seat).toHaveFocus());
  await user.type(seat, '{Enter}');
  expect(onSubmit).toHaveBeenCalledWith({ name: ['Ada'], seat: [] });
});

/** A one-question form whose answer the caller keeps, with Next kept unavailable until it has one. */
function KeptAnswer({
  answers,
  isReadOnly,
  onSubmit,
}: {
  answers: Record<string, string[]>;
  isReadOnly?: boolean;
  onSubmit?: (answers: Record<string, string[]>) => void;
}): ReactNode {
  const hasAnswer = (answers['note'] ?? []).length > 0;
  return (
    <Questionnaire aria-label="Note" answers={answers} isReadOnly={isReadOnly} onSubmit={onSubmit}>
      <QuestionnaireItem name="note" isRequired>
        <QuestionnaireTitle>A note for the crew</QuestionnaireTitle>
        <QuestionnaireInput defaultValue="Typed but not kept" />
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnaireSubmit
          isDisabled={!hasAnswer}
          focusableWhenDisabled
          tooltip={hasAnswer ? undefined : 'Write a note first'}
        />
      </QuestionnaireActions>
    </Questionnaire>
  );
}

it('UIC-QUESTIONNAIRE-1.4 reads the answers the caller keeps instead of its controls', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  const { rerender } = render(<KeptAnswer answers={{ note: [] }} onSubmit={onSubmit} />);
  const item = question('A note for the crew');
  await waitFor(() => expect(item).toHaveAttribute('data-status', 'unanswered'));
  rerender(<KeptAnswer answers={{ note: ['Kept note'] }} onSubmit={onSubmit} />);
  await waitFor(() => expect(item).toHaveAttribute('data-status', 'answered'));
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  expect(onSubmit).toHaveBeenCalledWith({ note: ['Kept note'] });
});

it('UIC-QUESTIONNAIRE-1.5 UIC-QUESTIONNAIRE-2.1 shows the answers read-only and keeps an action unavailable with its hint', () => {
  render(<KeptAnswer answers={{ note: [] }} isReadOnly />);
  const form = screen.getByRole('form', { name: 'Note' });
  expect(form).toHaveAttribute('data-read-only', 'true');
  expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  const submit = screen.getByRole('button', { name: 'Submit' });
  expect(submit).toHaveAttribute('aria-disabled', 'true');
  expect(submit).toHaveClass('ui-questionnaire__submit');
  expectHooksMatchSpec(form, 'QUESTIONNAIRE');
});

it('UIC-QUESTIONNAIRE-2.2 keeps focus in the question when Enter stops at it', async () => {
  const user = userEvent.setup();
  render(<Trip />);
  await user.click(screen.getByRole('radio', { name: /Ferry/ }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getByRole('button', { name: 'Next' }));
  const input = screen.getByRole('textbox', { name: 'A note for the crew' });
  await waitFor(() => expect(input).toHaveFocus());
  await user.keyboard('{Enter}');
  expect(question('A note for the crew')).toHaveAttribute('data-invalid', 'true');
  expect(input).toHaveFocus();
});
