import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { ColorField } from '../color-field/color-field.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import { TextField } from '../text-field/text-field.js';
import { Form, useFormProblems, useFormValidity, type FormBlocker } from './form.js';

/** A Save button outside the submit: it saves only while nothing blocks, and asks nothing else. */
function SaveBar({ onSave }: { onSave: () => void }) {
  const validity = requireDefined(useFormValidity());
  const blockers = useSyncExternalStore(validity.subscribe, validity.getBlockers);
  return (
    <>
      <output aria-label="Verdict">
        {blockers.length === 0
          ? 'ready'
          : blockers.map((blocker) => `${blocker.label}: ${blocker.status}`).join('; ')}
      </output>
      <button type="button" onClick={() => !validity.isBlocked() && onSave()}>
        Save
      </button>
      <button type="button" onClick={() => validity.validate()}>
        Check
      </button>
    </>
  );
}

function renderForm(fields: ReactNode, onSave = vi.fn(), onSubmit = vi.fn()) {
  const view = render(
    <UiProvider locale="en-US">
      <Form aria-label="Record" onSubmit={onSubmit}>
        {fields}
        <SaveBar onSave={onSave} />
      </Form>
    </UiProvider>,
  );
  const verdict = () => screen.getByRole('status', { name: 'Verdict' });
  return { ...view, verdict, onSave, onSubmit };
}

const segment = (name: RegExp) => screen.getAllByRole('spinbutton', { name })[0];

describe('Form validity', () => {
  it('UIC-FORM-2.1 UIC-FORM-2.2 UIC-DATE-TIME-FIELD-4.5 blocks on a date typed in part, without revealing or changing anything', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { verdict, onSave, container } = renderForm(
      <DateTimeField label="Due" defaultValue="2026-04-13" onChange={onChange} />,
    );
    expect(verdict()).toHaveTextContent('ready');
    act(() => requireDefined(segment(/^day/)).focus());
    await user.keyboard('{Backspace}{Backspace}');
    await waitFor(() => expect(verdict()).toHaveTextContent('Due: invalid'));
    const field = requireDefined(container.querySelector('.ui-date-time-field'));
    expect(field).toHaveAttribute('data-validation', 'valid');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(field).toHaveAttribute('data-validation', 'valid');

    act(() => requireDefined(segment(/^day/)).focus());
    await user.keyboard('20');
    await waitFor(() => expect(verdict()).toHaveTextContent('ready'));
    expect(onChange).toHaveBeenLastCalledWith('2026-04-20');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('UIC-FORM-2.1 UIC-DATE-TIME-FIELD-4.5 blocks on a range with one end left empty', async () => {
    const user = userEvent.setup();
    const { verdict } = renderForm(<DateTimeField label="Stay" mode="date-range" />);
    act(() => requireDefined(segment(/^month/)).focus());
    await user.keyboard('04132026');
    await waitFor(() => expect(verdict()).toHaveTextContent('Stay: invalid'));
  });

  it('UIC-FORM-2.1 UIC-COLOR-FIELD-4.4 blocks on typed text that is no colour until it is fixed or put back', async () => {
    const user = userEvent.setup();
    const { verdict } = renderForm(
      <ColorField label="Accent" allowsTyping defaultValue="#336699" />,
    );
    const input = screen.getByRole('textbox', { name: 'Accent' });
    await user.clear(input);
    await user.type(input, 'teal-ish');
    await waitFor(() => expect(verdict()).toHaveTextContent('Accent: invalid'));
    await user.clear(input);
    await user.type(input, '#ff0000');
    await waitFor(() => expect(verdict()).toHaveTextContent('ready'));
    await user.type(input, 'zz');
    await waitFor(() => expect(verdict()).toHaveTextContent('Accent: invalid'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(verdict()).toHaveTextContent('ready'));
  });

  it('UIC-FORM-2.2 follows required, pending and warning checks, disabled fields and unmount', async () => {
    let finish: (issues: null) => void = () => undefined;
    // A stable validator: a new function would be a new validator, checking the value again.
    const checkCode = () => new Promise<null>((resolve) => (finish = resolve));
    function Fields() {
      const [isDisabled, setDisabled] = useState(false);
      const [isShown, setShown] = useState(true);
      return (
        <>
          <TextField label="Name" isRequired isDisabled={isDisabled} />
          <TextField label="Note" validate={() => ({ severity: 'warning', message: 'Short' })} />
          {isShown ? <TextField label="Code" defaultValue="A1" validateAsync={checkCode} /> : null}
          <button type="button" onClick={() => setDisabled((value) => !value)}>
            Toggle name
          </button>
          <button type="button" onClick={() => setShown(false)}>
            Drop code
          </button>
        </>
      );
    }
    const user = userEvent.setup();
    const { verdict } = renderForm(<Fields />);
    await waitFor(() => expect(verdict()).toHaveTextContent('Name: invalid; Code: pending'));
    await act(async () => finish(null));
    await waitFor(() => expect(verdict()).toHaveTextContent(/^Name: invalid$/));
    await user.click(screen.getByRole('button', { name: 'Toggle name' }));
    await waitFor(() => expect(verdict()).toHaveTextContent('ready'));
    await user.click(screen.getByRole('button', { name: 'Toggle name' }));
    await waitFor(() => expect(verdict()).toHaveTextContent('Name: invalid'));
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada');
    await waitFor(() => expect(verdict()).toHaveTextContent('ready'));
    await user.click(screen.getByRole('button', { name: 'Drop code' }));
    expect(verdict()).toHaveTextContent('ready');
  });

  it('UIC-FORM-2.2 UIC-FIELD-3.8 blocks Save while a value checked before is checked again', async () => {
    const pending: Array<(issues: null) => void> = [];
    const checkCode = () => new Promise<null>((resolve) => pending.push(resolve));
    const user = userEvent.setup();
    const { verdict, onSave } = renderForm(
      <TextField label="Code" defaultValue="A" validateAsync={checkCode} />,
    );
    await waitFor(() => expect(pending).toHaveLength(1));
    await act(async () => pending[0]?.(null));
    await waitFor(() => expect(verdict()).toHaveTextContent('ready'));
    const input = screen.getByRole('textbox', { name: 'Code' });
    await user.type(input, 'B');
    await user.type(input, '{Backspace}');
    expect(input).toHaveValue('A');
    expect(verdict()).toHaveTextContent('Code: pending');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();
    await waitFor(() => expect(pending.length).toBeGreaterThan(1));
    await act(async () => pending.at(-1)?.(null));
    await waitFor(() => expect(verdict()).toHaveTextContent('ready'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('UIC-FORM-2.2 UIC-FIELD-3.8 stops blocking once a check throws before returning its promise', async () => {
    const user = userEvent.setup();
    const checkCode = (): Promise<null> => {
      throw new Error('Invalid endpoint');
    };
    const { verdict, onSave } = renderForm(
      <TextField label="Code" defaultValue="A" validateAsync={checkCode} />,
    );
    await waitFor(() => expect(verdict()).toHaveTextContent('ready'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('UIC-FORM-2.3 checks deliberately: reveals every field and focuses the first blocker', async () => {
    const user = userEvent.setup();
    const { onSubmit, container } = renderForm(
      <>
        <TextField label="Name" isRequired />
        <TextField label="City" isRequired />
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
    expect(container.querySelectorAll('.ui-field[data-validation="invalid"]')).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('UIC-FORM-2.2 tells onValidityChange the blockers as they change', async () => {
    const user = userEvent.setup();
    const onValidityChange = vi.fn<(blockers: readonly FormBlocker[]) => void>();
    render(
      <Form aria-label="Record" onValidityChange={onValidityChange}>
        <TextField label="Name" isRequired />
      </Form>,
    );
    await waitFor(() =>
      expect(onValidityChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ label: 'Name', status: 'invalid' }),
      ]),
    );
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada');
    await waitFor(() => expect(onValidityChange).toHaveBeenLastCalledWith([]));
    expect(screen.getByRole('textbox', { name: 'Name' })).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-FORM-2.2 hands out a new blocker when an equal-looking field replaces another', async () => {
    const onValidityChange = vi.fn<(blockers: readonly FormBlocker[]) => void>();
    const view = (key: string) => (
      <Form aria-label="Record" onValidityChange={onValidityChange}>
        <TextField key={key} label="Name" isRequired />
      </Form>
    );
    const { rerender } = render(view('first'));
    await waitFor(() => expect(onValidityChange).toHaveBeenCalledTimes(1));
    const [first] = requireDefined(onValidityChange.mock.lastCall)[0];
    rerender(view('second'));
    await waitFor(() => expect(onValidityChange).toHaveBeenCalledTimes(2));
    const [second] = requireDefined(onValidityChange.mock.lastCall)[0];
    expect(second).not.toBe(first);
    act(() => requireDefined(second).focus());
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  });

  it('UIC-FORM-2.2 keeps problems and blockers in document order when keyed fields move', async () => {
    const onValidityChange = vi.fn<(blockers: readonly FormBlocker[]) => void>();
    let problems: () => readonly string[] = () => [];
    function ProblemReader() {
      const source = requireDefined(useFormProblems());
      problems = () => source.getProblems().map((problem) => problem.label);
      return null;
    }
    const view = (names: readonly string[]) => (
      <Form aria-label="Record" validationMode="immediate" onValidityChange={onValidityChange}>
        {names.map((name) => (
          <TextField key={name} label={name} isRequired />
        ))}
        <ProblemReader />
      </Form>
    );
    const { rerender } = render(view(['Alpha', 'Blue', 'Gamma']));
    const labels = () =>
      requireDefined(onValidityChange.mock.lastCall)[0].map((blocker) => blocker.label);
    await waitFor(() => expect(labels()).toEqual(['Alpha', 'Blue', 'Gamma']));
    expect(problems()).toEqual(['Alpha', 'Blue', 'Gamma']);
    rerender(view(['Gamma', 'Alpha', 'Blue']));
    await waitFor(() => expect(labels()).toEqual(['Gamma', 'Alpha', 'Blue']));
    expect(problems()).toEqual(['Gamma', 'Alpha', 'Blue']);
  });
});
