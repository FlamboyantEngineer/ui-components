import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { CodeDiagnostic, CodeToken } from '../code-editor/code-editor.js';
import { QueryField, type QueryGrammar } from './query-field.js';

/** A sample language: `field:value` terms; `colour` is unknown, and `old` only warns. */
function tokenize(source: string): CodeToken[] {
  return (source.match(/([a-z]+(?=:)|:|\s+|[^\s:]+)/g) ?? []).map((text) => ({
    text,
    type: /^[a-z]+$/.test(text) && source.includes(`${text}:`) ? 'key' : null,
  }));
}

function diagnose(query: string): CodeDiagnostic[] {
  const problems: CodeDiagnostic[] = [];
  const unknown = query.indexOf('colour:');
  if (unknown >= 0) problems.push({ message: 'Unknown field.', line: 1, column: unknown + 1 });
  const old = query.indexOf('old:');
  if (old >= 0) {
    problems.push({ message: 'Deprecated field.', line: 1, column: old + 1, severity: 'warning' });
  }
  return problems;
}

const grammar: QueryGrammar = {
  tokenize,
  complete: [{ label: 'genre:' }, { label: 'pages:' }],
  diagnose,
};

function Controlled({ onSubmit }: { onSubmit?: (query: string) => void }) {
  const [query, setQuery] = useState('genre:history');
  return (
    <>
      <QueryField
        label="Query"
        grammar={grammar}
        value={query}
        onChange={setQuery}
        onSubmit={onSubmit}
      />
      <output data-testid="query">{query}</output>
    </>
  );
}

describe('QueryField', () => {
  it('UIC-QUERY-FIELD-1.1 UIC-QUERY-FIELD-1.2 labels a one-line editor highlighted by the grammar', () => {
    render(
      <QueryField
        label="Query"
        grammar={grammar}
        defaultValue="genre:history"
        placeholder="genre:x"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Query' });
    expect(input).toHaveAttribute('aria-multiline', 'false');
    expect(input).toHaveAttribute('placeholder', 'genre:x');
    expect(screen.getByText('Query')).toHaveClass('ui-query-field__label');
    const editor = input.closest('.ui-code-editor');
    expect(editor).toHaveClass('ui-query-field__editor');
    expect(editor).toHaveAttribute('data-single-line', 'true');
    expect(editor?.querySelector('[data-token="key"]')).toHaveTextContent('genre');
    expect(screen.queryByRole('button', { name: 'Run query' })).toBeNull();
  });

  it('UIC-QUERY-FIELD-1.2 completes from the grammar', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByRole('textbox', { name: 'Query' });
    await user.click(input);
    await user.keyboard('{End} pa');
    const list = await screen.findByRole('listbox');
    await user.click(within(list).getByRole('option', { name: /pages:/ }));
    expect(screen.getByTestId('query')).toHaveTextContent('genre:history pages:');
  });

  it('UIC-QUERY-FIELD-1.3 UIC-QUERY-FIELD-1.4 submits on Enter and the run button unless invalid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Controlled onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: 'Query' });
    const run = screen.getByRole('button', { name: 'Run query' });
    await user.click(input);
    await user.keyboard('{End}{Enter}');
    expect(onSubmit).toHaveBeenLastCalledWith('genre:history');
    expect(input).toHaveValue('genre:history');
    await user.keyboard(' old:x');
    await user.click(run);
    expect(onSubmit).toHaveBeenLastCalledWith('genre:history old:x');
    expect(input.closest('.ui-query-field')).not.toHaveAttribute('data-invalid');
    await user.click(input);
    await user.keyboard('{End} colour:red{Escape}{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(input.closest('.ui-query-field')).toHaveAttribute('data-invalid', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(run).toBeDisabled();
    expect(document.querySelector('.ui-code-editor__diagnostics')).toHaveTextContent(
      'Unknown field.',
    );
    expectHooksMatchSpec(document.body, 'QUERY-FIELD', { slots: 'all' });
  });

  it('UIC-QUERY-FIELD-1.5 refuses edits when read-only and everything when disabled', () => {
    const { rerender } = render(
      <QueryField
        label="Query"
        grammar={grammar}
        defaultValue="genre:a"
        isReadOnly
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Query' })).toHaveAttribute('readonly');
    rerender(
      <QueryField
        label="Query"
        grammar={grammar}
        defaultValue="genre:a"
        isDisabled
        onSubmit={vi.fn()}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Query' });
    expect(input).toBeDisabled();
    expect(input.closest('.ui-query-field')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Run query' })).toBeDisabled();
  });

  it('UIC-QUERY-FIELD-1.6 carries caller attributes', () => {
    const { container } = render(
      <QueryField id="query" className="custom" data-testid="field" label="Query" grammar={{}} />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('id', 'query');
    expect(root).toHaveClass('ui-query-field', 'custom');
    expect(root).toHaveAttribute('data-testid', 'field');
    act(() => screen.getByRole('textbox').focus());
    expectHooksMatchSpec(container, 'QUERY-FIELD', { callerAttributes: ['data-testid'] });
  });
});
