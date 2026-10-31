import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { pressReset, readPantry, ResetForm } from '../../../test/reset-fixtures.js';
import type { FieldIssues } from '../field/field.js';
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
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const input = screen.getByRole('searchbox');
    await user.type(input, 'fig');
    const clear = screen.getByRole('button', { name: 'Clear search' });
    expect(clear).toHaveClass('ui-search-field__clear', 'ui-button');
    expect(clear.querySelector('[data-glyph="close"]')).not.toBeNull();
    await user.tab();
    expect(clear).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
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
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<SearchField label="Find" value="fig" isDisabled />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
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
    const { container: hidden, unmount } = render(<SearchField label="Find a city" />);
    const plain = hidden.querySelector('.ui-search-field');
    expect(plain).toHaveAttribute('data-label-layout', 'control-only');
    expect(hidden.querySelector('.ui-search-field__label')).toBeNull();
    expect(hidden.querySelector('.ui-search-field__group')).toBeInTheDocument();
    unmount();
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
    ).toEqual(['ui-glyph', 'ui-search-field__input', 'ui-button']);
    expectHooksMatchSpec(container, 'SEARCH-FIELD', { slots: ['label', 'group'] });
  });

  it('UIC-SEARCH-FIELD-2.2 checks the query with field issues and shows the message below the box', async () => {
    const user = userEvent.setup();
    const validate = (value: string): FieldIssues => {
      if (value.length > 0 && value.length < 3) return { severity: 'error', message: 'Too short.' };
      return value === 'paris' ? { severity: 'warning', message: 'Did you mean Paris?' } : null;
    };
    const { container } = render(
      <SearchField
        label="Find a city"
        labelLayout="label-control"
        description="Type at least three letters."
        validate={validate}
      />,
    );
    const root = container.querySelector('.ui-search-field');
    const input = screen.getByRole('searchbox', { name: 'Find a city' });
    const message = container.querySelector('.ui-search-field__message');
    expect(container.querySelector('.ui-search-field__description')).toHaveTextContent(
      'Type at least three letters.',
    );
    expect(input).toHaveAccessibleDescription('Type at least three letters.');
    expect(message).toBeEmptyDOMElement();
    expect(message).toHaveAttribute('aria-live', 'polite');
    expect(root).toHaveAttribute('data-validation', 'valid');
    await user.type(input, 'Os');
    expect(message).toHaveTextContent('Too short.');
    expect(message).toHaveAttribute('data-severity', 'error');
    expect(root).toHaveAttribute('data-invalid', 'true');
    expect(root).toHaveAttribute('data-validation', 'invalid');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Type at least three letters. Too short.');
    expectHooksMatchSpec(container, 'SEARCH-FIELD', { slots: ['description', 'message'] });
    await user.clear(input);
    await user.type(input, 'paris');
    expect(message).toHaveTextContent('Did you mean Paris?');
    expect(message).toHaveAttribute('data-severity', 'warning');
    expect(root).not.toHaveAttribute('data-invalid');
    expect(root).toHaveAttribute('data-validation', 'warning');
  });

  it('UIC-SEARCH-FIELD-2.2 checks a controlled query and refuses a form submit only with native validation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const validate = (value: string): FieldIssues =>
      value === 'xx' ? { severity: 'error', message: 'No such city.' } : null;
    const { rerender } = render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <SearchField label="Find" value="xx" validate={validate} />
        <button type="submit">Go</button>
      </form>,
    );
    const input = screen.getByRole<HTMLInputElement>('searchbox', { name: 'Find' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.validity.valid).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    rerender(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <SearchField label="Find" value="xx" validate={validate} validationBehavior="native" />
        <button type="submit">Go</button>
      </form>,
    );
    expect(input.validity.customError).toBe(true);
    expect(input.validationMessage).toBe('No such city.');
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    rerender(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <SearchField label="Find" value="oslo" validate={validate} validationBehavior="native" />
        <button type="submit">Go</button>
      </form>,
    );
    expect(input.validity.valid).toBe(true);
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
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('UIC-SEARCH-FIELD-2.1 keeps the input, its text, selection and focus across label layout changes', async () => {
    const user = userEvent.setup();
    const inputRef = createRef<HTMLInputElement>();
    const { rerender } = render(
      <SearchField label="Search" defaultValue="draft" inputRef={inputRef} />,
    );
    const input = screen.getByRole('searchbox', { name: 'Search' }) as HTMLInputElement;
    await user.click(input);
    input.setSelectionRange(1, 3);
    rerender(
      <SearchField
        label="Search"
        defaultValue="draft"
        inputRef={inputRef}
        labelLayout="label-control"
        description="Matches names"
      />,
    );
    const labelled = screen.getByRole('searchbox', { name: 'Search' }) as HTMLInputElement;
    expect(labelled).toBe(input);
    expect(inputRef.current).toBe(input);
    expect(labelled).toHaveFocus();
    expect([labelled.selectionStart, labelled.selectionEnd]).toEqual([1, 3]);
    expect(labelled).toHaveAccessibleDescription('Matches names');
    await user.keyboard('X');
    expect(labelled).toHaveValue('dXft');

    rerender(<SearchField label="Search" defaultValue="draft" inputRef={inputRef} />);
    const bare = screen.getByRole('searchbox', { name: 'Search' });
    expect(bare).toBe(input);
    expect(bare).toHaveFocus();
    expect(bare).toHaveValue('dXft');
    expect(document.querySelector('.ui-search-field__label')).not.toBeInTheDocument();
    // The usual behaviour stays: Escape clears the query.
    await user.keyboard('{Escape}');
    expect(bare).toHaveValue('');
  });

  it('UIC-SEARCH-FIELD-1.6 keeps its query through a cancelled native reset and resets otherwise', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const validate = vi.fn(() => null);
    const field = (cancels: boolean) => (
      <ResetForm cancels={cancels}>
        <SearchField
          label="Label"
          name="label"
          defaultValue="cumin"
          onChange={onChange}
          validate={validate}
        />
      </ResetForm>
    );
    const { rerender } = render(field(true));
    const box = screen.getByRole('searchbox', { name: 'Label' });
    await user.type(box, 's');
    onChange.mockClear();
    validate.mockClear();
    await pressReset(user);
    expect(box).toHaveValue('cumins');
    expect(onChange).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    expect(readPantry()).toEqual([['label', 'cumins']]);
    rerender(field(false));
    await pressReset(user);
    expect(box).toHaveValue('cumin');
    expect(onChange.mock.calls).toEqual([['cumin']]);
  });
});
