import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SelectField } from './select-field.js';

const options = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
];

describe.each(['list', 'tree'] as const)('SelectField %s popup', (mode) => {
  it('UIC-SELECT-FIELD-12.1 forwards popup attributes without changing the field or layer', async () => {
    const user = userEvent.setup();
    const popoverProps = {
      id: 'choice-popup',
      className: 'compact-popup',
      'data-popup-density': 'compact',
      'data-popup-count': 2,
      'data-popup-enabled': false,
      'data-layer': 'caller-layer',
      'data-mode': mode === 'tree' ? 'caller-mode' : undefined,
    };
    const common = { id: 'choice-field', label: 'Choice', popoverProps };
    const { container } = render(
      mode === 'tree' ? (
        <SelectField {...common} mode="tree" items={options} getTextValue={(item) => item.label} />
      ) : (
        <SelectField {...common} options={options} />
      ),
    );
    const trigger = screen.getByRole('button', {
      name: mode === 'tree' ? /^Choice / : /Choice$/,
    });
    await user.click(trigger);
    const collection = await screen.findByRole(mode === 'tree' ? 'treegrid' : 'listbox');
    const popup = collection.closest<HTMLElement>('.ui-select-field__popover');
    expect(popup).toHaveAttribute('id', 'choice-popup');
    expect(popup).toHaveClass('ui-select-field__popover', 'compact-popup');
    expect(popup).toHaveAttribute('data-popup-density', 'compact');
    expect(popup).toHaveAttribute('data-popup-count', '2');
    expect(popup).toHaveAttribute('data-popup-enabled', 'false');
    expect(popup).toHaveAttribute('data-layer', 'dropdown');
    if (mode === 'tree') {
      expect(popup).toHaveAttribute('data-mode', 'tree');
      const dialog = screen.getByRole('dialog', { name: 'Choice' });
      expect(dialog.id).not.toBe('');
      expect(dialog.id).not.toBe('choice-popup');
      expect(trigger).toHaveAttribute('aria-controls', dialog.id);
    }
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', {
      slots: ['popover'],
      callerAttributes: ['data-popup-density', 'data-popup-count', 'data-popup-enabled'],
    });
    expect(container).not.toContainElement(popup);
    expect(container.querySelector('.ui-select-field')).toHaveAttribute('id', 'choice-field');
    expect(container.querySelector('.ui-select-field')).not.toHaveClass('compact-popup');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(popup).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
