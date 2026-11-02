import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StrictMode, useState, type FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { CellCoordinates } from '../../utils/cell-reference.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import type { CodeTokenizer } from '../code-editor/code-editor.js';
import { Modal } from '../modal/modal.js';
import { FormulaBar } from './formula-bar.js';

const tokenize: CodeTokenizer = (source) =>
  (source.match(/[A-Z]+[0-9]+|[0-9.]+|\s+|./g) ?? []).map((text) => ({
    text,
    type: /^[A-Z]+[0-9]+$/.test(text) ? 'reference' : /^[0-9.]+$/.test(text) ? 'number' : null,
  }));

const referenceBox = () => screen.getByRole('textbox', { name: 'Cell reference' });
const contentBox = () => screen.getByRole('textbox', { name: 'Cell content' });

const functions = [
  { label: 'SUM', description: 'Adds the values' },
  { label: 'AVERAGE', description: 'Averages the values', insertText: 'AVG' },
];

/** A grid of contents the bar edits, as a caller holds it. */
function Sheet(props: { onCommit?: (value: string, cell: CellCoordinates) => void }) {
  const [cells, setCells] = useState<Record<string, string>>({ '0:0': '=B1*2', '0:1': '21' });
  const [cell, setCell] = useState<CellCoordinates | null>({ row: 0, column: 0 });
  const key = cell ? `${cell.row}:${cell.column}` : '';
  return (
    <FormulaBar
      cell={cell}
      value={cells[key] ?? ''}
      rowCount={10}
      columnCount={4}
      tokenize={tokenize}
      onCellChange={setCell}
      onCommit={(value, at) => {
        props.onCommit?.(value, at);
        setCells({ ...cells, [`${at.row}:${at.column}`]: value });
      }}
    />
  );
}

describe('FormulaBar', () => {
  it('UIC-FORMULA-BAR-3.5 inserts a chosen function at the caret without committing', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <FormulaBar
        cell={{ row: 0, column: 0 }}
        value="=B1*2"
        functions={functions}
        onCommit={onCommit}
      />,
    );
    expect(container.querySelector('.ui-formula-bar__glyph')).toBeNull();
    const button = screen.getByRole('button', { name: 'Insert function' });
    expect(button).toHaveClass('ui-formula-bar__functions', 'ui-dropdown-menu');
    expectHooksMatchSpec(container, 'FORMULA-BAR', {
      slots: ['reference', 'status', 'cancel', 'confirm', 'functions', 'editor'],
    });
    const box = contentBox() as HTMLTextAreaElement;
    await user.click(box);
    box.setSelectionRange(1, 3);
    await user.click(button);
    const option = screen.getByRole('menuitem', { name: /SUM/ });
    expect(option).toHaveTextContent('Adds the values');
    await user.click(option);
    expect(contentBox()).toHaveValue('=SUM(B1)*2');
    await vi.waitFor(() => expect(contentBox()).toHaveFocus());
    expect([box.selectionStart, box.selectionEnd]).toEqual([7, 7]);
    expect(container.firstElementChild).toHaveAttribute('data-dirty', 'true');
    expect(onCommit).not.toHaveBeenCalled();
    // The keyboard opens the menu too, and insertText takes the place of the label.
    box.setSelectionRange(8, 8);
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(contentBox()).toHaveValue('=SUM(B1)AVG()*2');
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenCalledWith('=SUM(B1)AVG()*2', { row: 0, column: 0 });
  });

  it('UIC-FORMULA-BAR-3.5 starts an empty content with = and closes the list on Escape', async () => {
    const user = userEvent.setup();
    render(<FormulaBar cell={{ row: 0, column: 0 }} value="" functions={functions} />);
    const button = screen.getByRole('button', { name: 'Insert function' });
    await user.click(button);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await vi.waitFor(() => expect(button).toHaveFocus());
    await user.click(button);
    await user.click(screen.getByRole('menuitem', { name: /SUM/ }));
    expect(contentBox()).toHaveValue('=SUM()');
  });

  it('UIC-FORMULA-BAR-3.5 disables the function button while locked or read-only', () => {
    const { rerender } = render(<FormulaBar cell={null} value="" functions={functions} />);
    const button = () => screen.getByRole('button', { name: 'Insert function' });
    expect(button()).toBeDisabled();
    rerender(<FormulaBar cell={{ row: 0, column: 0 }} value="" functions={functions} isReadOnly />);
    expect(button()).toBeDisabled();
    rerender(<FormulaBar cell={{ row: 0, column: 0 }} value="" functions={functions} isDisabled />);
    expect(button()).toBeDisabled();
    rerender(<FormulaBar cell={{ row: 0, column: 0 }} value="" functions={functions} />);
    expect(button()).toBeEnabled();
  });

  it('UIC-FORMULA-BAR-2.1 UIC-FORMULA-BAR-3.1 shows the active cell and its raw content', () => {
    const { container } = render(<Sheet />);
    expect(referenceBox()).toHaveValue('A1');
    expect(contentBox()).toHaveValue('=B1*2');
    expect(container.querySelector('.ui-formula-bar__editor')).toHaveClass('ui-code-editor');
    expect(container.querySelector('[data-token="reference"]')).toHaveTextContent('B1');
    expect(container.querySelector('.ui-formula-bar__glyph')).toHaveAttribute(
      'data-glyph',
      'formula',
    );
    expect(container.firstElementChild).not.toHaveAttribute('data-dirty');
    expectHooksMatchSpec(container, 'FORMULA-BAR', {
      slots: ['reference', 'status', 'cancel', 'confirm', 'glyph', 'editor'],
    });
  });

  it('UIC-FORMULA-BAR-2.1 selects the reference when the box takes focus', async () => {
    const user = userEvent.setup();
    render(<Sheet />);
    await user.click(referenceBox());
    const box = referenceBox() as HTMLInputElement;
    expect([box.selectionStart, box.selectionEnd]).toEqual([0, 2]);
  });

  it('UIC-FORMULA-BAR-2.2 moves to a typed reference inside the grid', async () => {
    const user = userEvent.setup();
    render(<Sheet />);
    await user.click(referenceBox());
    await user.keyboard('b1{Enter}');
    expect(referenceBox()).toHaveValue('B1');
    expect(contentBox()).toHaveValue('21');
    const box = referenceBox() as HTMLInputElement;
    expect([box.selectionStart, box.selectionEnd]).toEqual([0, 2]);
    await user.keyboard('a1{Enter}');
    expect(referenceBox()).toHaveValue('A1');
  });

  it('UIC-FORMULA-BAR-2.2 refuses a reference outside the grid or not a cell', async () => {
    const user = userEvent.setup();
    const { container } = render(<Sheet />);
    await user.click(referenceBox());
    await user.keyboard('E1{Enter}');
    expect(referenceBox()).toHaveValue('E1');
    expect(referenceBox()).toHaveAttribute('aria-invalid', 'true');
    expect(referenceBox()).toHaveAttribute('data-invalid', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('No cell named E1');
    expectHooksMatchSpec(container, 'FORMULA-BAR');
    await user.keyboard('{Backspace}');
    expect(referenceBox()).not.toHaveAttribute('aria-invalid');
    await user.keyboard('{Backspace}A11{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('No cell named A11');
    await user.keyboard('{Escape}');
    expect(referenceBox()).toHaveValue('A1');
    expect(referenceBox()).not.toHaveAttribute('aria-invalid');
    await user.keyboard('zz{Enter}');
    expect(referenceBox()).toHaveAttribute('aria-invalid', 'true');
    await user.tab();
    expect(referenceBox()).toHaveValue('A1');
    expect(referenceBox()).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-FORMULA-BAR-2.2 leaves an Escape with nothing to drop to a Modal around the bar', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal isOpen onOpenChange={onOpenChange} title="Sheet">
        <Sheet />
      </Modal>,
    );
    await user.click(referenceBox());
    await user.keyboard('c9');
    await user.keyboard('{Escape}');
    expect(referenceBox()).toHaveValue('A1');
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('UIC-FORMULA-BAR-3.2 commits the draft with Enter and the confirm button', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(<Sheet onCommit={onCommit} />);
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm).toBeDisabled();
    await user.click(contentBox());
    await user.keyboard('{End}+1');
    expect(container.firstElementChild).toHaveAttribute('data-dirty', 'true');
    expect(confirm).toBeEnabled();
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenCalledWith('=B1*2+1', { row: 0, column: 0 });
    expect(contentBox()).toHaveValue('=B1*2+1');
    expect(container.firstElementChild).not.toHaveAttribute('data-dirty');
    await user.keyboard('0');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onCommit).toHaveBeenLastCalledWith('=B1*2+10', { row: 0, column: 0 });
  });

  it('UIC-FORMULA-BAR-3.4 drops the buttons and describes the keys instead', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <FormulaBar
        cell={{ row: 0, column: 0 }}
        value="=1"
        showActions={false}
        evaluate={() => '1'}
        onCommit={onCommit}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(container.querySelector('.ui-formula-bar__cancel')).toBeNull();
    expect(contentBox()).toHaveAccessibleDescription('Result 1 Enter confirms, Escape cancels.');
    await user.click(contentBox());
    await user.keyboard('{End}+2{Escape}');
    expect(contentBox()).toHaveValue('=1');
    await user.keyboard('{End}+2{Enter}');
    expect(onCommit).toHaveBeenCalledWith('=1+2', { row: 0, column: 0 });
  });

  it('UIC-FORMULA-BAR-2.2 keeps every reference Enter from submitting a form around the bar', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Sheet />
      </form>,
    );
    await user.click(referenceBox());
    await user.keyboard('{Enter}');
    await user.keyboard('b1{Enter}');
    expect(referenceBox()).toHaveValue('B1');
    await user.keyboard('{Enter}');
    await user.keyboard('zz{Enter}');
    expect(referenceBox()).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([
    ['while composing', { isComposing: true }],
    ['with key code 229', { keyCode: 229 }],
  ])(
    'UIC-FORMULA-BAR-2.2 UIC-FORMULA-BAR-3.2 leaves the Enter that confirms a text composition, %s',
    async (_, composition) => {
      const user = userEvent.setup();
      const onCommit = vi.fn();
      render(<Sheet onCommit={onCommit} />);
      await user.click(contentBox());
      await user.keyboard('{End}9');
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing or keyCode on a keydown
      fireEvent.keyDown(contentBox(), { key: 'Enter', ...composition });
      expect(onCommit).not.toHaveBeenCalled();
      await user.click(referenceBox());
      await user.keyboard('b1');
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing or keyCode on a keydown
      fireEvent.keyDown(referenceBox(), { key: 'Enter', ...composition });
      expect(referenceBox()).toHaveValue('b1');
      expect(referenceBox()).not.toHaveAttribute('aria-invalid');
    },
  );

  it('UIC-FORMULA-BAR-3.2 restores the content with Escape and the cancel button', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Sheet onCommit={onCommit} />);
    await user.click(contentBox());
    await user.keyboard('{End}9');
    await user.keyboard('{Escape}');
    expect(contentBox()).toHaveValue('=B1*2');
    await user.keyboard('{End}9');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(contentBox()).toHaveValue('=B1*2');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('UIC-FORMULA-BAR-3.1 starts the draft over when the active cell changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FormulaBar cell={{ row: 0, column: 0 }} value="1" />);
    await user.click(contentBox());
    await user.keyboard('{End}5');
    expect(contentBox()).toHaveValue('15');
    rerender(<FormulaBar cell={{ row: 1, column: 0 }} value="1" />);
    expect(contentBox()).toHaveValue('1');
    expect(referenceBox()).toHaveValue('A2');
  });

  it.each([
    ['another cell', { row: 0, column: 1 }, 'B'],
    ['no active cell', null, ''],
    ['another value', { row: 0, column: 0 }, 'A from elsewhere'],
  ])(
    'UIC-FORMULA-BAR-3.1 discards an abandoned draft after %s, and returns to the value',
    async (_, through, throughValue) => {
      const user = userEvent.setup();
      const a1 = { row: 0, column: 0 };
      const { rerender } = render(
        <StrictMode>
          <FormulaBar cell={a1} value="A" />
        </StrictMode>,
      );
      await user.click(contentBox());
      await user.keyboard('{End} changed');
      rerender(
        <StrictMode>
          <FormulaBar cell={a1} value="A" placeholder="Content" />
        </StrictMode>,
      );
      expect(contentBox()).toHaveValue('A changed');
      rerender(
        <StrictMode>
          <FormulaBar cell={through} value={throughValue} />
        </StrictMode>,
      );
      rerender(
        <StrictMode>
          <FormulaBar cell={a1} value="A" />
        </StrictMode>,
      );
      expect(contentBox()).toHaveValue('A');
      expect(screen.getByRole('group')).not.toHaveAttribute('data-dirty');
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    },
  );

  it('UIC-FORMULA-BAR-2.2 drops a refused reference once another cell is active', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FormulaBar cell={{ row: 0, column: 0 }} value="" rowCount={5} />);
    await user.click(referenceBox());
    await user.keyboard('A99{Enter}');
    expect(referenceBox()).toHaveAttribute('aria-invalid', 'true');
    rerender(<FormulaBar cell={{ row: 0, column: 1 }} value="" rowCount={5} />);
    rerender(<FormulaBar cell={{ row: 0, column: 0 }} value="" rowCount={5} />);
    expect(referenceBox()).toHaveValue('A1');
    expect(referenceBox()).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-FORMULA-BAR-3.1 UIC-FORMULA-BAR-3.2 locks the content without a cell, disabled or read-only', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container, rerender } = render(
      <FormulaBar cell={null} value="" onCommit={onCommit} placeholder="Pick a cell" />,
    );
    expect(referenceBox()).toHaveValue('');
    expect(contentBox()).toBeDisabled();
    expect(contentBox()).toHaveAttribute('placeholder', 'Pick a cell');
    expect(container.firstElementChild).toHaveAttribute('data-disabled', 'true');
    rerender(<FormulaBar cell={{ row: 0, column: 0 }} value="7" isDisabled />);
    expect(contentBox()).toBeDisabled();
    expect(referenceBox()).toBeDisabled();
    rerender(<FormulaBar cell={{ row: 0, column: 0 }} value="7" isReadOnly onCommit={onCommit} />);
    expect(container.firstElementChild).not.toHaveAttribute('data-disabled');
    expect(contentBox()).toHaveAttribute('readonly');
    await user.click(contentBox());
    await user.keyboard('{Enter}');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('UIC-FORMULA-BAR-3.2 neither commits nor cancels a draft while disabled, and keeps it for later', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const cell = { row: 0, column: 0 };
    const { rerender } = render(<FormulaBar cell={cell} value="=1" onCommit={onCommit} />);
    await user.click(contentBox());
    await user.keyboard('{End}{Backspace}2');
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    act(() => confirm.focus());
    rerender(<FormulaBar cell={cell} value="=1" onCommit={onCommit} isDisabled />);
    expect(confirm).toBeDisabled();
    expect(cancel).toBeDisabled();
    await user.keyboard('{Enter}');
    await user.click(confirm);
    await user.click(cancel);
    expect(onCommit).not.toHaveBeenCalled();
    expect(contentBox()).toHaveValue('=2');
    rerender(<FormulaBar cell={cell} value="=1" onCommit={onCommit} />);
    expect(contentBox()).toHaveValue('=2');
    expect(onCommit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith('=2', cell);
  });

  it('UIC-FORMULA-BAR-3.2 keeps Cancel and disables Confirm on a read-only bar', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const cell = { row: 0, column: 0 };
    const { rerender } = render(<FormulaBar cell={cell} value="=1" onCommit={onCommit} />);
    await user.click(contentBox());
    await user.keyboard('{End}{Backspace}2');
    rerender(<FormulaBar cell={cell} value="=1" onCommit={onCommit} isReadOnly />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    await user.click(contentBox());
    await user.keyboard('{Enter}');
    expect(onCommit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(contentBox()).toHaveValue('=1');
  });

  it('UIC-FORMULA-BAR-3.1 completes words from the caller', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(
      <FormulaBar
        cell={{ row: 0, column: 0 }}
        value=""
        completions={[{ label: 'SUM' }, { label: 'AVERAGE' }]}
        onCommit={onCommit}
      />,
    );
    await user.click(contentBox());
    await user.keyboard('=SU');
    expect(await screen.findByRole('option', { name: /SUM/ })).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(contentBox()).toHaveValue('=SUM');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('UIC-FORMULA-BAR-3.3 shows the caller’s evaluation of the draft', async () => {
    const user = userEvent.setup();
    const evaluate = vi.fn((value: string) => (value.startsWith('=') ? `${value.length}` : value));
    const { container } = render(
      <FormulaBar cell={{ row: 2, column: 1 }} value="=1+1" evaluate={evaluate} />,
    );
    const result = requireDefined(container.querySelector('.ui-formula-bar__result'));
    expect(result).toHaveTextContent('Result 4');
    expect(evaluate).toHaveBeenLastCalledWith('=1+1', { row: 2, column: 1 });
    expect(contentBox()).toHaveAccessibleDescription('Result 4');
    await user.click(contentBox());
    await user.keyboard('{End}0');
    expect(result).toHaveTextContent('Result 5');
    expectHooksMatchSpec(container, 'FORMULA-BAR', { slots: ['result'] });
  });

  it('UIC-FORMULA-BAR-3.3 leaves out an empty result, keeping no room for it', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FormulaBar cell={{ row: 0, column: 0 }} value="" evaluate={(value) => value} />,
    );
    expect(container.querySelector('.ui-formula-bar__result')).not.toBeInTheDocument();
    expect(contentBox()).not.toHaveAttribute('aria-describedby');
    await user.click(contentBox());
    await user.keyboard('7');
    expect(container.querySelector('.ui-formula-bar__result')).toHaveTextContent('Result 7');
    expect(contentBox()).toHaveAccessibleDescription('Result 7');
    await user.keyboard('{Backspace}');
    expect(container.querySelector('.ui-formula-bar__result')).not.toBeInTheDocument();
  });

  it('UIC-FORMULA-BAR-4.1 names the group', () => {
    const { rerender } = render(<FormulaBar cell={null} value="" />);
    expect(screen.getByRole('group', { name: 'Formula bar' })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="sheet">Budget</h2>
        <FormulaBar cell={null} value="" aria-labelledby="sheet" aria-describedby="sheet" />
      </>,
    );
    const group = screen.getByRole('group', { name: 'Budget' });
    expect(group).not.toHaveAttribute('aria-label');
    expect(group).toHaveAttribute('aria-describedby', 'sheet');
  });

  it('UIC-FORMULA-BAR-4.2 forwards the class, id and data attributes', () => {
    const { container } = render(
      <FormulaBar cell={null} value="" className="host" id="bar" data-testid="formula" />,
    );
    const root = requireDefined(container.firstElementChild);
    expect(root).toHaveClass('ui-formula-bar', 'host');
    expect(root).toHaveAttribute('id', 'bar');
    expect(root).toHaveAttribute('data-testid', 'formula');
    expectHooksMatchSpec(container, 'FORMULA-BAR', { callerAttributes: ['data-testid'] });
  });
});
