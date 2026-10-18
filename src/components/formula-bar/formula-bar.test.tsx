import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { CellCoordinates } from '../../utils/cell-reference.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { CodeTokenizer } from '../code-editor/code-editor.js';
import { FormulaBar } from './formula-bar.js';

const tokenize: CodeTokenizer = (source) =>
  (source.match(/[A-Z]+[0-9]+|[0-9.]+|\s+|./g) ?? []).map((text) => ({
    text,
    type: /^[A-Z]+[0-9]+$/.test(text) ? 'reference' : /^[0-9.]+$/.test(text) ? 'number' : null,
  }));

const referenceBox = () => screen.getByRole('textbox', { name: 'Cell reference' });
const contentBox = () => screen.getByRole('textbox', { name: 'Cell content' });

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
    const result = container.querySelector('.ui-formula-bar__result')!;
    expect(result).toHaveTextContent('Result 4');
    expect(evaluate).toHaveBeenLastCalledWith('=1+1', { row: 2, column: 1 });
    expect(contentBox()).toHaveAccessibleDescription('Result 4');
    await user.click(contentBox());
    await user.keyboard('{End}0');
    expect(result).toHaveTextContent('Result 5');
    expectHooksMatchSpec(container, 'FORMULA-BAR', { slots: ['result'] });
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
    const root = container.firstElementChild!;
    expect(root).toHaveClass('ui-formula-bar', 'host');
    expect(root).toHaveAttribute('id', 'bar');
    expect(root).toHaveAttribute('data-testid', 'formula');
    expectHooksMatchSpec(container, 'FORMULA-BAR', { callerAttributes: ['data-testid'] });
  });
});
