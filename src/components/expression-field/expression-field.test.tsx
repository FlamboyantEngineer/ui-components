import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { pressComposingKeys } from '../../../test/composition.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { CodeToken } from '../code-editor/code-editor.js';
import { ExpressionField, type ExpressionFieldResult } from './expression-field.js';

const exact = '9007199254740993.0000000000000001';

const tokenize = (source: string): CodeToken[] =>
  (source.match(/\d+(?:\.\d+)?|\s+|\S/g) ?? []).map((text) => ({
    text,
    type: /^\d/.test(text) ? 'number' : null,
  }));

const resultOf = (container: HTMLElement) =>
  container.querySelector('.ui-expression-field__result');

describe('ExpressionField', () => {
  it('UIC-EXPRESSION-FIELD-1.1 UIC-EXPRESSION-FIELD-1.4 UIC-EXPRESSION-FIELD-2.1 UIC-EXPRESSION-FIELD-2.3 renders the source, unit, actions and result', () => {
    const { container } = render(
      <ExpressionField
        label="Length"
        defaultValue="2 * 3"
        unit="m"
        actions={<button type="button">Insert</button>}
        result={{ status: 'ready', source: '2 * 3', value: '6' }}
        tokenize={tokenize}
        diagnostics={[{ message: 'Check the factor.', line: 1, column: 5, severity: 'warning' }]}
        className="host"
        data-kind="sample"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Length' });
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Result 6'));
    expect(screen.getByRole('button', { name: 'Insert' })).toBeInTheDocument();
    const root = container.querySelector('.ui-expression-field');
    expect(root).toHaveClass('ui-field', 'host');
    expect(root).toHaveAttribute('data-kind', 'sample');
    expect(root).toHaveAttribute('data-status', 'ready');
    expect(container.querySelector('[data-token="number"]')).toHaveTextContent('2');
    // Diagnostics mark the source; the field's validity stays its own.
    expect(root).toHaveAttribute('data-validation', 'valid');
    expectHooksMatchSpec(container, 'EXPRESSION-FIELD', {
      slots: ['editor', 'unit', 'actions', 'result', 'result-value'],
      callerAttributes: ['data-kind'],
    });
  });

  it('UIC-EXPRESSION-FIELD-2.1 shows pending, invalid and unavailable results', () => {
    const results: ExpressionFieldResult[] = [
      { status: 'pending', source: 'a' },
      { status: 'invalid', source: 'a', message: 'Unknown name.' },
      { status: 'unavailable' },
      { status: 'unavailable', message: 'Offline.' },
    ];
    const texts = ['Evaluating…', 'Unknown name.', 'No result', 'Offline.'];
    results.forEach((result, index) => {
      const { container, unmount } = render(
        <ExpressionField label="Value" defaultValue="a" result={result} />,
      );
      expect(resultOf(container)).toHaveAttribute('data-status', result.status);
      expect(screen.getByRole('textbox', { name: 'Value' })).toHaveAccessibleDescription(
        `Result ${texts[index] ?? ''}`,
      );
      unmount();
    });
    const { container } = render(<ExpressionField label="Bare" defaultValue="a" />);
    expect(resultOf(container)).toBeNull();
    expect(container.querySelector('.ui-expression-field')).not.toHaveAttribute('data-status');
  });

  it('UIC-EXPRESSION-FIELD-1.2 keeps exact literals through change, commit and form values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <form aria-label="Sample">
        <ExpressionField
          label="Tolerance"
          name="tolerance"
          defaultValue="1e-100"
          onChange={onChange}
          onCommit={onCommit}
        />
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Tolerance' });
    expect(input).toHaveValue('1e-100');
    await user.clear(input);
    await user.type(input, exact);
    expect(onChange).toHaveBeenLastCalledWith(exact);
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith(exact);
    expect(input).toHaveValue(exact);
    const form = screen.getByRole('form', { name: 'Sample' }) as HTMLFormElement;
    expect(new FormData(form).get('tolerance')).toBe(exact);
  });

  it('UIC-EXPRESSION-FIELD-1.3 commits on Enter and blur and restores on Escape', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const onKeyDown = vi.fn();
    render(
      // A dialog-like container that would close on an Escape reaching it.
      <div role="group" aria-label="Panel" onKeyDown={(event) => onKeyDown(event.key)}>
        <ExpressionField label="Value" defaultValue="0.10" onCommit={onCommit} />
        <button type="button">Next</button>
      </div>,
    );
    const input = screen.getByRole('textbox', { name: 'Value' });
    await user.click(input);
    await user.keyboard('{End}0');
    expect(input).toHaveValue('0.100');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('0.10');
    expect(onKeyDown).not.toHaveBeenCalledWith('Escape');
    expect(onCommit).not.toHaveBeenCalled();
    await user.keyboard('{End}5');
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('0.105');
    await user.keyboard('{End}{Backspace}');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onCommit).toHaveBeenLastCalledWith('0.10');
  });

  it('UIC-EXPRESSION-FIELD-1.3 leaves composing keys to the input method', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<ExpressionField label="Value" defaultValue="1" onCommit={onCommit} />);
    const input = screen.getByRole('textbox', { name: 'Value' });
    await user.type(input, '2');
    pressComposingKeys(input);
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue('12');
  });

  it('UIC-EXPRESSION-FIELD-1.3 refuses edits while read-only or disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <ExpressionField label="Locked" defaultValue="1" isReadOnly onChange={onChange} />
        <ExpressionField label="Off" defaultValue="2" isDisabled onChange={onChange} />
      </>,
    );
    await user.type(screen.getByRole('textbox', { name: 'Locked' }), '5');
    expect(screen.getByRole('textbox', { name: 'Off' })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-EXPRESSION-FIELD-1.3 follows external source replacement', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [source, setSource] = useState('1 + 1');
      return (
        <>
          <ExpressionField label="Value" value={source} onChange={setSource} />
          <button type="button" onClick={() => setSource('7e300')}>
            Replace
          </button>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Replace' }));
    expect(screen.getByRole('textbox', { name: 'Value' })).toHaveValue('7e300');
  });

  it('UIC-EXPRESSION-FIELD-2.2 marks a result for older source stale and never touches the draft', async () => {
    const user = userEvent.setup();
    function Host() {
      const [result, setResult] = useState<ExpressionFieldResult>({
        status: 'ready',
        source: '1 + 1',
        value: '2',
      });
      return (
        <>
          <ExpressionField label="Value" defaultValue="1 + 1" result={result} />
          <button
            type="button"
            onClick={() => setResult({ status: 'ready', source: '1 + 1', value: '2.0' })}
          >
            Late answer
          </button>
        </>
      );
    }
    const { container } = render(<Host />);
    const input = screen.getByRole('textbox', { name: 'Value' });
    expect(resultOf(container)).not.toHaveAttribute('data-stale');
    await user.type(input, '0');
    expect(resultOf(container)).toHaveAttribute('data-stale', 'true');
    expect(container.querySelector('.ui-expression-field')).toHaveAttribute('data-stale', 'true');
    expect(input).toHaveAccessibleDescription('Result 2 (Out of date)');
    const caret = (input as HTMLTextAreaElement).selectionStart;
    await user.click(screen.getByRole('button', { name: 'Late answer' }));
    expect(input).toHaveValue('1 + 10');
    expect((input as HTMLTextAreaElement).selectionStart).toBe(caret);
    expect(input).toHaveAccessibleDescription('Result 2.0 (Out of date)');
  });

  it('UIC-EXPRESSION-FIELD-2.3 keeps several fields independent', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ExpressionField label="First" defaultValue="1" />
        <ExpressionField label="Second" defaultValue="2" />
      </>,
    );
    await user.type(screen.getByRole('textbox', { name: 'First' }), '0');
    expect(screen.getByRole('textbox', { name: 'First' })).toHaveValue('10');
    expect(screen.getByRole('textbox', { name: 'Second' })).toHaveValue('2');
  });
});
