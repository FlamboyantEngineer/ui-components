import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SearchField } from './search-field.js';

describe('SearchField', () => {
  it('UIC-SEARCH-FIELD-1.1 draws a glyph and a search input named by its label', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <SearchField label="Filter fruit" placeholder="Search fruit" onChange={onChange} />,
    );
    const input = screen.getByRole('searchbox', { name: 'Filter fruit' });
    expect(input).toHaveClass('ui-search-field__input');
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute('placeholder', 'Search fruit');
    const glyph = container.querySelector('.ui-search-field__glyph');
    expect(glyph).toHaveAttribute('data-glyph', 'search');
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    await user.type(input, 'ap');
    expect(onChange.mock.calls.map(([value]) => value)).toEqual(['a', 'ap']);
    expectHooksMatchSpec(container, 'SEARCH-FIELD', { slots: 'all' });
  });

  it('UIC-SEARCH-FIELD-1.2 publishes its size', () => {
    const { container, rerender } = render(<SearchField label="Find" />);
    const root = container.querySelector('.ui-search-field');
    expect(root).toHaveAttribute('data-size', 'md');
    rerender(<SearchField label="Find" size="sm" />);
    expect(root).toHaveAttribute('data-size', 'sm');
    expectHooksMatchSpec(container, 'SEARCH-FIELD');
  });

  it('UIC-SEARCH-FIELD-1.3 clears from a reachable button that leaves while empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<SearchField label="Find" onChange={onChange} onClear={onClear} />);
    expect(screen.queryByRole('button')).toBeNull();
    const input = screen.getByRole('searchbox');
    await user.type(input, 'fig');
    const clear = screen.getByRole('button', { name: 'Clear search' });
    expect(clear).toHaveClass('ui-search-field__clear', 'ui-icon-button');
    expect(clear.querySelector('[data-glyph="close"]')).not.toBeNull();
    await user.tab();
    expect(clear).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('UIC-SEARCH-FIELD-1.3 shows clear text with its own name and hides it while locked', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <SearchField
        label="Find"
        defaultValue="fig"
        clearText="Clear"
        clearLabel="Clear the filter"
      />,
    );
    const clear = screen.getByRole('button', { name: 'Clear the filter' });
    expect(clear).toHaveClass('ui-button', 'ui-search-field__clear');
    expect(clear).toHaveTextContent('Clear');
    expectHooksMatchSpec(container, 'SEARCH-FIELD', { slots: ['clear'] });
    await user.click(clear);
    expect(screen.getByRole('searchbox')).toHaveValue('');
    rerender(<SearchField label="Find" value="fig" isReadOnly />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<SearchField label="Find" value="fig" isDisabled />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('UIC-SEARCH-FIELD-1.4 clears on Escape and submits on Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const outer = vi.fn();
    render(
      <div onKeyDown={(event) => outer(event.key)}>
        <SearchField label="Find" onSubmit={onSubmit} />
      </div>,
    );
    const input = screen.getByRole('searchbox');
    await user.type(input, 'plum{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('plum');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
    expect(outer).not.toHaveBeenCalledWith('Escape');
    await user.keyboard('{Escape}');
    expect(outer).toHaveBeenCalledWith('Escape');
  });

  it('UIC-SEARCH-FIELD-1.5 forwards the class name, data attributes and id to its root', () => {
    const { container } = render(
      <SearchField label="Find" id="find" className="toolbar-search" data-test="find" />,
    );
    const root = container.querySelector('.ui-search-field');
    expect(root).toHaveClass('ui-search-field', 'toolbar-search');
    expect(root).toHaveAttribute('data-test', 'find');
    expect(root).toHaveAttribute('data-empty', 'true');
    expectHooksMatchSpec(container, 'SEARCH-FIELD', { callerAttributes: ['data-test'] });
  });
});
