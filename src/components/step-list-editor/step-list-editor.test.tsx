import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  StepListEditor,
  type StepListEditorColumn,
  type StepListEditorProps,
  type StepListEditorStep,
} from './step-list-editor.js';

const columns: StepListEditorColumn[] = [
  { id: 'action', label: 'Action', placeholder: 'What to do' },
  { id: 'expected', label: 'Expected result' },
];

const steps: StepListEditorStep[] = [
  { id: 'open', values: { action: 'Open the form', expected: 'The form shows' } },
  { id: 'type', values: { action: 'Type a name' } },
  { id: 'save', values: { action: 'Press Save', expected: 'The name is saved' } },
];

function Controlled(
  props: Partial<StepListEditorProps> & {
    onValue?: (steps: readonly StepListEditorStep[]) => void;
  },
) {
  const [value, setValue] = useState(props.defaultValue ?? steps);
  return (
    <StepListEditor
      columns={columns}
      {...props}
      defaultValue={undefined}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onValue?.(next);
      }}
    />
  );
}

const step = (number: number) => screen.getByRole('group', { name: `Step ${number}` });
const stepItem = (number: number) => requireDefined(step(number).closest('li'));
const field = (number: number, name: string) => within(step(number)).getByRole('textbox', { name });
const idsOf = (list: readonly StepListEditorStep[] | undefined) => list?.map(({ id }) => id);

async function runAction(user: ReturnType<typeof userEvent.setup>, number: number, name: string) {
  await user.click(screen.getByRole('button', { name: `Actions for step ${number}` }));
  await user.click(await screen.findByRole('menuitem', { name }));
}

// Menus open and close through React Aria overlays, which is slow under a loaded runner.
describe('StepListEditor', { timeout: 15_000 }, () => {
  it('UIC-STEP-LIST-EDITOR-1.1 UIC-STEP-LIST-EDITOR-4.1 draws numbered steps with a field per column', () => {
    const { container } = render(<StepListEditor columns={columns} defaultValue={steps} />);
    const editor = screen.getByRole('group', { name: 'Steps' });
    expect(editor).toHaveClass('ui-step-list-editor');
    const header = container.querySelector('.ui-step-list-editor__header');
    expect(header).toHaveAttribute('aria-hidden', 'true');
    expect(header).toHaveTextContent('ActionExpected result');
    expect(within(editor).getAllByRole('listitem')).toHaveLength(3);
    expect(
      [...container.querySelectorAll('.ui-step-list-editor__number')].map((n) => n.textContent),
    ).toEqual(['1', '2', '3']);
    expect(stepItem(2)).toHaveAttribute('data-key', 'type');
    expect(field(1, 'Action')).toHaveValue('Open the form');
    expect(field(2, 'Expected result')).toHaveValue('');
    expect(field(2, 'Expected result').tagName).toBe('TEXTAREA');
    expect(field(1, 'Action')).toHaveAttribute('placeholder', 'What to do');
    expect(field(1, 'Action').closest('.ui-step-list-editor__field')).toHaveAttribute(
      'data-column',
      'action',
    );
    expect(screen.getByRole('button', { name: 'Move step 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for step 3' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'STEP-LIST-EDITOR', {
      slots: [
        'header',
        'heading',
        'steps',
        'step',
        'handle',
        'number',
        'fields',
        'field',
        'actions',
        'add',
      ],
    });
  });

  it('UIC-STEP-LIST-EDITOR-4.1 takes the caller’s name', () => {
    render(<StepListEditor columns={columns} aria-label="Checkout steps" />);
    expect(screen.getByRole('group', { name: 'Checkout steps' })).toBeInTheDocument();
  });

  it('UIC-STEP-LIST-EDITOR-1.2 shows an empty state without steps', () => {
    const { container } = render(<StepListEditor columns={columns} />);
    expect(container.querySelector('.ui-step-list-editor__empty')).toHaveTextContent(
      'No steps yet.',
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'STEP-LIST-EDITOR', { slots: ['empty', 'add'] });
  });

  it('UIC-STEP-LIST-EDITOR-1.3 reports each edit as new plain steps', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    await user.type(field(2, 'Expected result'), 'Ok');
    expect(onValue.mock.lastCall?.[0][1]).toEqual({
      id: 'type',
      values: { action: 'Type a name', expected: 'Ok' },
    });
    expect(onValue.mock.lastCall?.[0][0]).toBe(steps[0]);
  });

  it('UIC-STEP-LIST-EDITOR-2.1 adds and inserts steps, moving focus', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    await user.click(screen.getByRole('button', { name: 'Add step' }));
    let next = onValue.mock.lastCall?.[0] as StepListEditorStep[];
    expect(next).toHaveLength(4);
    expect(next[3]?.values).toEqual({});
    expect(field(4, 'Action')).toHaveFocus();

    await runAction(user, 1, 'Insert step above');
    next = onValue.mock.lastCall?.[0];
    expect(idsOf(next)?.slice(1)).toEqual(['open', 'type', 'save', requireDefined(next[4]).id]);
    expect(field(1, 'Action')).toHaveFocus();

    await runAction(user, 2, 'Insert step below');
    next = onValue.mock.lastCall?.[0];
    expect(next[1]?.id).toBe('open');
    expect(next[2]?.values).toEqual({});
    expect(field(3, 'Action')).toHaveFocus();
  });

  it('UIC-STEP-LIST-EDITOR-1.3 gives added steps ids no restored step holds', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const view = render(<StepListEditor columns={columns} value={steps} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add step' }));
    const first = requireDefined((onChange.mock.lastCall?.[0] as StepListEditorStep[])[3]).id;
    // A list saved earlier holds the ids this editor would make next.
    const base = first.slice(0, -1);
    const restored: StepListEditorStep[] = [
      ...steps,
      { id: `${base}2`, values: { action: 'Restored' } },
      { id: `${base}3`, values: { action: 'Kept' } },
    ];
    view.rerender(<StepListEditor columns={columns} value={restored} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add step' }));
    const added = onChange.mock.lastCall?.[0] as StepListEditorStep[];
    expect(new Set(idsOf(added)).size).toBe(6);
    view.rerender(<StepListEditor columns={columns} value={added} onChange={onChange} />);
    await runAction(user, 4, 'Duplicate');
    const duplicated = onChange.mock.lastCall?.[0] as StepListEditorStep[];
    expect(new Set(idsOf(duplicated)).size).toBe(7);
    view.rerender(<StepListEditor columns={columns} value={added} onChange={onChange} />);
    await user.type(field(6, 'Action'), 'N');
    const edited = onChange.mock.lastCall?.[0] as StepListEditorStep[];
    expect(edited.map((item) => item.values.action)).toEqual([
      'Open the form',
      'Type a name',
      'Press Save',
      'Restored',
      'Kept',
      'N',
    ]);
  });

  it('UIC-STEP-LIST-EDITOR-2.1 duplicates and deletes steps, moving focus', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    await runAction(user, 1, 'Duplicate');
    let next = onValue.mock.lastCall?.[0] as StepListEditorStep[];
    expect(next[1]?.values).toEqual(requireDefined(steps[0]).values);
    expect(new Set(idsOf(next)).size).toBe(next.length);
    expect(field(2, 'Action')).toHaveFocus();

    await runAction(user, 2, 'Delete');
    next = onValue.mock.lastCall?.[0];
    expect(idsOf(next)).toEqual(['open', 'type', 'save']);
    expect(field(2, 'Action')).toHaveFocus();
  });
  it('UIC-STEP-LIST-EDITOR-2.1 moves focus back along the list and then to the add button', async () => {
    const user = userEvent.setup();
    render(<Controlled defaultValue={steps.slice(0, 2)} />);
    await runAction(user, 2, 'Delete');
    expect(field(1, 'Action')).toHaveFocus();
    await runAction(user, 1, 'Delete');
    expect(screen.getByRole('button', { name: 'Add step' })).toHaveFocus();
  });

  it('UIC-STEP-LIST-EDITOR-2.2 moves a step from its menu, refusing moves past the ends', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    await user.click(screen.getByRole('button', { name: 'Actions for step 1' }));
    expect(await screen.findByRole('menuitem', { name: 'Move up' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('menuitem', { name: 'Move down' }));
    expect(idsOf(onValue.mock.lastCall?.[0])).toEqual(['type', 'open', 'save']);
    expect(screen.getByRole('button', { name: 'Actions for step 2' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Actions for step 3' }));
    expect(await screen.findByRole('menuitem', { name: 'Move down' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('UIC-STEP-LIST-EDITOR-2.3 moves the step with Alt+Arrow keys, keeping focus', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    const handle = screen.getByRole('button', { name: 'Move step 1' });
    act(() => handle.focus());
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(onValue).not.toHaveBeenCalled();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(idsOf(onValue.mock.lastCall?.[0])).toEqual(['type', 'open', 'save']);
    expect(handle).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Move step 2' })).toBe(handle);

    const menu = screen.getByRole('button', { name: 'Actions for step 2' });
    act(() => menu.focus());
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(idsOf(onValue.mock.lastCall?.[0])).toEqual(['type', 'save', 'open']);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.keyboard('{Shift>}{Alt>}{ArrowUp}{/Alt}{/Shift}');
    expect(onValue).toHaveBeenCalledTimes(2);
  });

  it("UIC-STEP-LIST-EDITOR-2.3 leaves Alt+Arrow keys to a step's text field", () => {
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    // eslint-disable-next-line testing-library/prefer-user-event -- the test reads whether the keydown was prevented
    const isKept = fireEvent.keyDown(field(1, 'Action'), { key: 'ArrowDown', altKey: true });
    expect(isKept).toBe(true);
    expect(onValue).not.toHaveBeenCalled();
  });

  it.each([
    ['while composing', { isComposing: true }],
    ['with key code 229', { keyCode: 229 }],
  ])(
    'UIC-STEP-LIST-EDITOR-2.3 leaves Alt+Arrow keys an input method composes, %s',
    (_, composition) => {
      const onValue = vi.fn();
      render(<Controlled onValue={onValue} />);
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing or keyCode on a keydown
      fireEvent.keyDown(field(1, 'Action'), { key: 'ArrowDown', altKey: true, ...composition });
      expect(onValue).not.toHaveBeenCalled();
    },
  );

  it('UIC-STEP-LIST-EDITOR-2.4 UIC-DRAG-INTERACTIONS-2.3 makes a step draggable only while its handle is pressed', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const item = stepItem(1);
    expect(item).not.toHaveAttribute('draggable');
    await user.pointer({ keys: '[MouseLeft>]', target: field(1, 'Action') });
    expect(item).not.toHaveAttribute('draggable');
    await user.pointer({ keys: '[/MouseLeft]' });
    const handle = screen.getByRole('button', { name: 'Move step 1' });
    await user.pointer({ keys: '[MouseLeft>]', target: handle });
    expect(item).toHaveAttribute('draggable', 'true');
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(item).not.toHaveAttribute('draggable');
    await user.pointer({ keys: '[MouseLeft>]', target: handle });
    fireEvent.dragEnd(item, { dataTransfer: { dropEffect: 'none' } });
    expect(item).not.toHaveAttribute('draggable');
  });

  it('UIC-STEP-LIST-EDITOR-3.1 marks steps, fields and the list that differ from the committed steps', () => {
    const edited = [
      { id: 'open', values: { action: 'Open the page', expected: 'The form shows' } },
      requireDefined(steps[1]),
      { id: 'new', values: { action: 'Close' } },
    ];
    const { container } = render(
      <StepListEditor columns={columns} defaultValue={edited} committedValue={steps} />,
    );
    expect(screen.getByRole('group', { name: 'Steps' })).toHaveAttribute('data-dirty', 'true');
    expect(stepItem(1)).toHaveAttribute('data-dirty', 'true');
    expect(stepItem(2)).not.toHaveAttribute('data-dirty');
    expect(stepItem(3)).toHaveAttribute('data-dirty', 'true');
    expect(field(1, 'Action').closest('.ui-text-field')).toHaveAttribute('data-dirty', 'true');
    expect(field(1, 'Expected result').closest('.ui-text-field')).not.toHaveAttribute('data-dirty');
    expect(field(3, 'Action').closest('.ui-text-field')).not.toHaveAttribute('data-dirty');
    expectHooksMatchSpec(container, 'STEP-LIST-EDITOR');
  });

  it('UIC-STEP-LIST-EDITOR-3.1 marks a list whose steps moved or went, and nothing without committed steps', () => {
    const { rerender } = render(
      <StepListEditor
        columns={columns}
        value={[requireDefined(steps[1]), requireDefined(steps[0]), requireDefined(steps[2])]}
        committedValue={steps}
      />,
    );
    const editor = screen.getByRole('group', { name: 'Steps' });
    expect(editor).toHaveAttribute('data-dirty', 'true');
    expect(editor.querySelector('[data-dirty]')).toBeNull();
    rerender(<StepListEditor columns={columns} value={steps.slice(1)} committedValue={steps} />);
    expect(editor).toHaveAttribute('data-dirty', 'true');
    rerender(<StepListEditor columns={columns} value={steps} committedValue={steps} />);
    expect(editor).not.toHaveAttribute('data-dirty');
    rerender(<StepListEditor columns={columns} value={[{ id: 'x', values: {} }]} />);
    expect(editor.querySelectorAll('[data-dirty]')).toHaveLength(0);
    expect(editor).not.toHaveAttribute('data-dirty');
  });

  it('UIC-STEP-LIST-EDITOR-3.1 keeps the fields of a new step, or of an uncommitted list, as plain inputs', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <StepListEditor
        columns={columns}
        defaultValue={[...steps, { id: 'new', values: { action: 'Close' } }]}
        committedValue={steps}
      />,
    );
    await user.type(field(4, 'Action'), ' the tab');
    await user.tab();
    expect(field(4, 'Action')).toHaveValue('Close the tab');
    expect(field(4, 'Action').closest('.ui-text-field')).not.toHaveAttribute('data-dirty');
    expect(screen.queryByRole('button', { name: /Restore/ })).not.toBeInTheDocument();
    rerender(<StepListEditor columns={columns} defaultValue={steps} />);
    await user.type(field(1, 'Action'), '!');
    expect(field(1, 'Action').closest('.ui-text-field')).not.toHaveAttribute('data-dirty');
    expect(screen.queryByRole('button', { name: /Restore/ })).not.toBeInTheDocument();
  });

  it('UIC-STEP-LIST-EDITOR-3.2 shows read-only steps without handles, menus or the add button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StepListEditor columns={columns} defaultValue={steps} onChange={onChange} isReadOnly />,
    );
    const editor = screen.getByRole('group', { name: 'Steps' });
    expect(editor).toHaveAttribute('data-readonly', 'true');
    expect(within(editor).queryAllByRole('button')).toHaveLength(0);
    expect(field(1, 'Action')).toHaveAttribute('readonly');
    act(() => field(1, 'Action').focus());
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(onChange).not.toHaveBeenCalled();
  });
});
