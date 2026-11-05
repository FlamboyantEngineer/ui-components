import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ConstraintEditor } from './constraint-editor.js';
import type { ConstraintSet } from './constraint-model.js';

const rowOf = (container: HTMLElement, constraint: string) =>
  container.querySelector<HTMLElement>(
    `.ui-constraint-editor__row[data-constraint="${constraint}"]`,
  );

describe('ConstraintEditor', () => {
  it('UIC-CONSTRAINT-EDITOR-2.1 UIC-CONSTRAINT-EDITOR-2.5 lays out one field per offered constraint', () => {
    const { container } = render(
      <ConstraintEditor
        kind="text"
        aria-label="Name constraints"
        defaultValue={{ required: false, minLength: 0 }}
        className="host"
        data-kind-source="sample"
      />,
    );
    const panel = screen.getByRole('region', { name: 'Name constraints' });
    expect(panel).toHaveClass('ui-property-panel', 'ui-constraint-editor', 'host');
    expect(panel).toHaveAttribute('data-kind', 'text');
    expect(panel).toHaveAttribute('data-kind-source', 'sample');
    for (const label of ['Default value', 'Longest length', 'Pattern']) {
      expect(screen.getByRole('textbox', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: /Optional Required/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Shortest length' })).toHaveValue('0');
    expect(rowOf(container, 'min-length')).toBeInTheDocument();
    expectHooksMatchSpec(container, 'CONSTRAINT-EDITOR', {
      slots: ['row', 'unset'],
      callerAttributes: ['data-kind-source'],
    });
  });

  it('UIC-CONSTRAINT-EDITOR-1.1 UIC-CONSTRAINT-EDITOR-2.1 narrows to the declared constraints and kinds', () => {
    const { container, rerender } = render(
      <ConstraintEditor kind="number" aria-label="Rules" constraints={['maximum', 'required']} />,
    );
    const rows = [...container.querySelectorAll('.ui-constraint-editor__row')];
    expect(rows.map((row) => row.getAttribute('data-constraint'))).toEqual(['required', 'maximum']);
    expect(screen.getByRole('textbox', { name: 'Maximum' })).toHaveAttribute(
      'inputmode',
      'decimal',
    );
    rerender(
      <ConstraintEditor
        kind="options"
        aria-label="Rules"
        options={[{ id: 'red', label: 'Red' }]}
        constraints={['default', 'maxCount']}
      />,
    );
    expect(screen.getByRole('button', { name: /Default value/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Most choices' })).toBeInTheDocument();
  });

  it('UIC-CONSTRAINT-EDITOR-1.2 UIC-CONSTRAINT-EDITOR-2.2 sets, empties and unsets constraints', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConstraintEditor kind="text" aria-label="Rules" onChange={onChange} />);
    const fallback = screen.getByRole('textbox', { name: 'Default value' });
    await user.type(fallback, 'a');
    expect(onChange).toHaveBeenLastCalledWith({ default: 'a' }, []);
    await user.clear(fallback);
    expect(onChange).toHaveBeenLastCalledWith({ default: '' }, []);
    await user.click(screen.getByRole('button', { name: 'Unset Default value' }));
    expect(onChange).toHaveBeenLastCalledWith({}, []);
    expect(screen.queryByRole('button', { name: 'Unset Default value' })).not.toBeInTheDocument();
    const pattern = screen.getByRole('textbox', { name: 'Pattern' });
    await user.type(pattern, 'x');
    await user.clear(pattern);
    expect(onChange).toHaveBeenLastCalledWith({}, []);
  });

  it('UIC-CONSTRAINT-EDITOR-1.2 UIC-CONSTRAINT-EDITOR-2.2 keeps decimal text exactly and tells unset from false', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConstraintEditor kind="number" aria-label="Rules" onChange={onChange} />);
    await user.type(screen.getByRole('textbox', { name: 'Maximum' }), '9007199254740993.10');
    expect(onChange).toHaveBeenLastCalledWith({ maximum: '9007199254740993.10' }, []);
    await user.click(screen.getByRole('button', { name: /Required$/ }));
    await user.click(await screen.findByRole('option', { name: 'Optional' }));
    expect(onChange).toHaveBeenLastCalledWith(
      { maximum: '9007199254740993.10', required: false },
      [],
    );
    await user.click(screen.getByRole('button', { name: 'Unset Required' }));
    expect(onChange).toHaveBeenLastCalledWith({ maximum: '9007199254740993.10' }, []);
  });

  it('UIC-CONSTRAINT-EDITOR-2.3 shows problems and host errors on their fields', () => {
    const { container } = render(
      <ConstraintEditor
        kind="number"
        aria-label="Rules"
        value={{ minimum: '10', maximum: '2' }}
        errors={{ minimum: 'The server rejects negative scales.' }}
      />,
    );
    expect(screen.getByRole('region', { name: 'Rules' })).toHaveAttribute('data-invalid', 'true');
    expect(screen.getByRole('textbox', { name: 'Maximum' })).toHaveAccessibleDescription(
      'The maximum is below the minimum.',
    );
    expect(screen.getByRole('textbox', { name: 'Minimum' })).toHaveAccessibleDescription(
      'The server rejects negative scales.',
    );
    expect(screen.getByRole('textbox', { name: 'Maximum' })).toHaveValue('2');
    expect(rowOf(container, 'maximum')).toBeInTheDocument();
  });

  it('UIC-CONSTRAINT-EDITOR-2.2 follows a replaced value', async () => {
    const user = userEvent.setup();
    function Host() {
      const [set, setSet] = useState<ConstraintSet>({ maxLength: 3 });
      return (
        <>
          <ConstraintEditor kind="text" aria-label="Rules" value={set} onChange={setSet} />
          <button type="button" onClick={() => setSet({ pattern: '[a-z]+' })}>
            Load other field
          </button>
        </>
      );
    }
    render(<Host />);
    expect(screen.getByRole('textbox', { name: 'Longest length' })).toHaveValue('3');
    await user.click(screen.getByRole('button', { name: 'Load other field' }));
    expect(screen.getByRole('textbox', { name: 'Longest length' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Pattern' })).toHaveValue('[a-z]+');
  });

  it('UIC-CONSTRAINT-EDITOR-2.4 locks constraints, the whole editor or disables it', () => {
    const { container, rerender } = render(
      <ConstraintEditor
        kind="text"
        aria-label="Rules"
        defaultValue={{ pattern: '\\w+', maxLength: 4 }}
        lockedConstraints={['pattern']}
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Pattern' })).toHaveAttribute('readonly');
    expect(rowOf(container, 'pattern')).toHaveAttribute('data-locked', 'true');
    expect(screen.queryByRole('button', { name: 'Unset Pattern' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unset Longest length' })).toBeInTheDocument();
    rerender(
      <ConstraintEditor
        kind="text"
        aria-label="Rules"
        isReadOnly
        defaultValue={{ maxLength: 4 }}
      />,
    );
    expect(screen.queryByRole('button', { name: /Unset/ })).not.toBeInTheDocument();
    rerender(<ConstraintEditor kind="text" aria-label="Rules" isDisabled />);
    expect(screen.getByRole('textbox', { name: 'Pattern' })).toBeDisabled();
  });

  it('UIC-CONSTRAINT-EDITOR-2.5 draws a host control in place of the library one', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ConstraintEditor
        kind="date"
        aria-label="Rules"
        onChange={onChange}
        renderConstraint={(control) =>
          control.name === 'default' ? (
            <button type="button" onClick={() => control.onChange('2026-01-01')}>
              Use first day of {control.label}
            </button>
          ) : undefined
        }
      />,
    );
    const row = screen.getByRole('button', { name: 'Use first day of Default value' });
    await user.click(row);
    expect(onChange).toHaveBeenLastCalledWith({ default: '2026-01-01' }, []);
    expect(
      within(screen.getByRole('region', { name: 'Rules' })).getAllByRole('group').length,
    ).toBeGreaterThan(0);
  });
});
