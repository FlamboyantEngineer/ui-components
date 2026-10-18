import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
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
    expectHooksMatchSpec(container, 'SEARCH-FIELD', { slots: ['glyph', 'input', 'clear'] });
  });

  it('UIC-SEARCH-FIELD-1.1 hands its input to inputRef', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(<SearchField label="Filter fruit" inputRef={inputRef} />);
    expect(inputRef.current).toBe(screen.getByRole('searchbox', { name: 'Filter fruit' }));
  });

  it('UIC-SEARCH-FIELD-1.1 UIC-FIELD-8.3 hands its input props, name and locks to the input', async () => {
    const user = userEvent.setup();
    const events: string[] = [];
    const { rerender } = render(
      <SearchField
        label="Find"
        name="query"
        defaultValue="fig"
        autoComplete="off"
        inputMode="search"
        spellCheck={false}
        autoFocus
        onBlur={() => events.push('blur')}
        onKeyDown={(event) => events.push(`key:${event.key}`)}
      />,
    );
    const input = screen.getByRole('searchbox', { name: 'Find' });
    expect(input).toHaveAttribute('name', 'query');
    expect(input).toHaveValue('fig');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('inputmode', 'search');
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input).toHaveFocus();
    await user.keyboard('s');
    await user.tab();
    expect(events).toEqual(['key:s', 'key:Tab', 'blur']);
    rerender(<SearchField label="Find" name="query" isReadOnly />);
    expect(input).toHaveAttribute('readonly');
    rerender(<SearchField label="Find" name="query" isDisabled />);
    expect(input).toBeDisabled();
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

  it('UIC-SEARCH-FIELD-2.1 draws its label above the box in the label-control layout', () => {
    const hidden = render(<SearchField label="Find a city" />);
    const plain = hidden.container.querySelector('.ui-search-field');
    expect(plain).toHaveAttribute('data-label-layout', 'control-only');
    expect(hidden.container.querySelector('.ui-search-field__label')).toBeNull();
    expect(hidden.container.querySelector('.ui-search-field__group')).toBeNull();
    hidden.unmount();
    const { container } = render(
      <SearchField label="Find a city" labelLayout="label-control" defaultValue="Os" />,
    );
    expect(container.querySelector('.ui-search-field')).toHaveAttribute(
      'data-label-layout',
      'label-control',
    );
    const label = container.querySelector('.ui-search-field__label');
    expect(label?.tagName).toBe('LABEL');
    const input = screen.getByRole('searchbox', { name: 'Find a city' });
    expect(input).not.toHaveAttribute('aria-label');
    const group = container.querySelector('.ui-search-field__group');
    expect(group).toHaveAttribute('role', 'presentation');
    expect(
      [...(group?.children ?? [])].map((node) => node.getAttribute('class')?.split(' ')[0]),
    ).toEqual(['ui-glyph', 'ui-search-field__input', 'ui-icon-button']);
    expectHooksMatchSpec(container, 'SEARCH-FIELD', { slots: ['label', 'group'] });
  });

  it('UIC-SEARCH-FIELD-2.2 describes the input and shows its error message below the box', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <SearchField
        label="Find a city"
        labelLayout="label-control"
        description="Type at least three letters."
        validationBehavior="aria"
        validate={(value) => (value.length > 0 && value.length < 3 ? 'Too short.' : null)}
      />,
    );
    const input = screen.getByRole('searchbox', { name: 'Find a city' });
    expect(container.querySelector('.ui-search-field__description')).toHaveTextContent(
      'Type at least three letters.',
    );
    expect(input).toHaveAccessibleDescription('Type at least three letters.');
    expect(container.querySelector('.ui-search-field__error')).toBeNull();
    await user.type(input, 'Os');
    expect(container.querySelector('.ui-search-field__error')).toHaveTextContent('Too short.');
    expect(container.querySelector('.ui-search-field')).toHaveAttribute('data-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Type at least three letters. Too short.');
    expectHooksMatchSpec(container, 'SEARCH-FIELD', { slots: ['description', 'error'] });
    rerender(
      <SearchField
        label="Find a city"
        labelLayout="label-control"
        isInvalid
        errorMessage="No such city."
      />,
    );
    expect(container.querySelector('.ui-search-field__error')).toHaveTextContent('No such city.');
    expect(container.querySelector('.ui-search-field__description')).toBeNull();
  });

  it('UIC-SEARCH-FIELD-2.3 shows a busy indicator while results load', () => {
    const { container, rerender } = render(
      <SearchField label="Find" defaultValue="fig" isPending />,
    );
    const root = container.querySelector('.ui-search-field');
    expect(root).toHaveAttribute('data-pending', 'true');
    const spinner = screen.getByRole('progressbar', { name: 'Loading' });
    expect(spinner).toHaveClass('ui-search-field__spinner');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'SEARCH-FIELD', { slots: ['spinner'] });
    rerender(<SearchField label="Find" defaultValue="fig" />);
    expect(root).not.toHaveAttribute('data-pending');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
