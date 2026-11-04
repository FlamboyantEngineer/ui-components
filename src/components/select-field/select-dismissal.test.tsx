import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Modal } from '../modal/modal.js';
import { SelectField } from './select-field.js';

const choices = [
  { id: 'apple', label: 'Apple' },
  { id: 'pear', label: 'Pear' },
];

for (const mode of ['list', 'tree'] as const) {
  for (const query of ['', 'p']) {
    it(`UIC-SELECT-FIELD-3.1 UIC-SELECT-FIELD-9.2 ${mode} closes on the first Escape with ${query ? 'a populated' : 'an empty'} filter`, async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onCommit = vi.fn();
      const onOpenChange = vi.fn();
      const props = { label: 'Choice', defaultValue: 'pear', onChange, onCommit, onOpenChange };
      render(
        mode === 'tree' ? (
          <SelectField {...props} mode="tree" items={choices} getTextValue={(item) => item.label} />
        ) : (
          <SelectField {...props} options={choices} filterable />
        ),
      );
      const trigger = screen.getByRole('button', { name: /Choice/ });
      await user.click(trigger);
      const search = screen.getByRole('searchbox');
      await waitFor(() => expect(search).toHaveFocus());
      if (query) await user.type(search, query);
      expect(search).toHaveValue(query);
      await user.keyboard('{Escape}');
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
      await waitFor(() => expect(trigger).toHaveFocus());
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      expect(trigger).toHaveAccessibleName(/Pear/);
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(onChange).not.toHaveBeenCalled();
      expect(onCommit).not.toHaveBeenCalled();
      await user.click(trigger);
      expect(screen.getByRole('searchbox')).toHaveValue('');
    });
  }

  it(`UIC-SELECT-FIELD-3.1 UIC-SELECT-FIELD-9.2 ${mode} Escape leaves the containing modal open`, async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const props = { label: 'Choice', defaultValue: 'pear' };
    render(
      <Modal title="Catalogue" defaultOpen onOpenChange={onOpenChange}>
        {mode === 'tree' ? (
          <SelectField {...props} mode="tree" items={choices} getTextValue={(item) => item.label} />
        ) : (
          <SelectField {...props} options={choices} filterable />
        )}
      </Modal>,
    );
    const trigger = screen.getByRole('button', { name: /Choice/ });
    await user.click(trigger);
    await user.type(screen.getByRole('searchbox'), 'p');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Catalogue' })).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
}
