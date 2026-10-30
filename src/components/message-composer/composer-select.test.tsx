import { CheckGlyph, HandRaisedGlyph, LockGlyph } from '../../core/glyphs.js';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { installComposerRow } from '../../../test/composer-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  MessageComposerSelect,
  type MessageComposerSelectOption,
  type MessageComposerSelectProps,
} from './composer-select.js';
import { MessageComposer } from './message-composer.js';

const options: MessageComposerSelectOption[] = [
  { id: 'ask', label: 'Ask first', icon: HandRaisedGlyph, description: 'Approve each change' },
  { id: 'auto', label: 'Run on its own', icon: CheckGlyph },
  {
    id: 'locked',
    label: 'Read only',
    icon: LockGlyph,
    description: 'Changes nothing',
    isDisabled: true,
    disabledReason: 'Needs an owner',
  },
];

const trigger = () => screen.getByRole('button', { name: /^Approval:/ });

function renderSelect(props: Partial<MessageComposerSelectProps> = {}) {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const view = render(
    <MessageComposer
      endControls={
        <MessageComposerSelect label="Approval" options={options} onChange={onChange} {...props} />
      }
    />,
  );
  return { ...view, user, onChange };
}

describe('MessageComposerSelect', () => {
  it('UIC-MESSAGE-COMPOSER-7.1 shows the current option with its icon on a named trigger', () => {
    const { container } = renderSelect({ defaultValue: 'auto' });
    expect(trigger()).toHaveAccessibleName('Approval: Run on its own');
    expect(trigger()).toHaveClass('ui-button', 'ui-message-composer__select');
    expect(trigger()).toHaveAttribute('data-variant', 'ghost');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger()).toHaveTextContent('Run on its own');
    expect(trigger().querySelector('.ui-button__start-icon [data-glyph="check"]')).not.toBeNull();
    expect(
      trigger().querySelector('.ui-button__end-icon [data-glyph="chevron-down"]'),
    ).not.toBeNull();
    expectHooksMatchSpec(container, 'MESSAGE-COMPOSER', { slots: ['select'] });
  });

  it('UIC-MESSAGE-COMPOSER-7.1 shows the icon alone while the composer is compact', () => {
    const row = installComposerRow();
    const { container } = renderSelect();
    row.resize(container, 100, 300);
    expect(trigger()).toHaveAttribute('data-content', 'icon');
    expect(trigger()).toHaveAccessibleName('Approval: Ask first');
    expect(trigger().querySelector('[data-glyph="hand-raised"]')).not.toBeNull();
    expect(trigger()).not.toHaveTextContent('Ask first');
  });

  it('UIC-MESSAGE-COMPOSER-7.1 disables the trigger with its own flag or the composer, and renders nothing without options', async () => {
    const { user, rerender } = renderSelect({ isDisabled: true });
    expect(trigger()).toBeDisabled();
    await user.click(trigger());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    rerender(
      <MessageComposer
        isDisabled
        endControls={<MessageComposerSelect label="Approval" options={options} />}
      />,
    );
    expect(trigger()).toBeDisabled();
    rerender(<MessageComposerSelect label="Approval" options={[]} />);
    expect(screen.queryByRole('button', { name: /^Approval/ })).not.toBeInTheDocument();
  });

  it('UIC-MESSAGE-COMPOSER-7.2 lists the options with icons and notes, the current one checked', async () => {
    const { user } = renderSelect();
    await user.click(trigger());
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveClass('ui-menu', 'ui-message-composer__select-menu');
    expect(menu).toHaveAccessibleName('Approval: Ask first');
    const items = within(menu).getAllByRole('menuitemradio');
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(items[0]).toHaveAccessibleName('Ask first Approve each change');
    expect(items[0]?.querySelector('[data-glyph="hand-raised"]')).not.toBeNull();
    expect(items[2]).toHaveAccessibleName('Read only Needs an owner');
    expect(items[2]).toHaveAttribute('aria-disabled', 'true');
    expectHooksMatchSpec(document.body, 'MESSAGE-COMPOSER', { slots: ['select', 'select-menu'] });
  });

  it('UIC-MESSAGE-COMPOSER-7.2 UIC-MESSAGE-COMPOSER-7.3 reports a chosen option, refuses a disabled one and closes', async () => {
    const { user, onChange } = renderSelect();
    await user.click(trigger());
    let menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitemradio', { name: /^Read only/ }));
    expect(onChange).not.toHaveBeenCalled();
    expect(menu).toBeInTheDocument();
    await user.click(within(menu).getByRole('menuitemradio', { name: /^Ask first/ }));
    expect(onChange).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await user.click(trigger());
    menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitemradio', { name: 'Run on its own' }));
    expect(onChange).toHaveBeenCalledWith('auto');
    await waitFor(() => expect(trigger()).toHaveFocus());
    expect(trigger()).toHaveAccessibleName('Approval: Run on its own');
  });

  it('UIC-MESSAGE-COMPOSER-7.3 follows a controlled value and falls back to the first available option', async () => {
    const { user, onChange, rerender } = renderSelect({ value: 'locked' });
    expect(trigger()).toHaveAccessibleName('Approval: Read only');
    await user.click(trigger());
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitemradio', { name: 'Run on its own' }));
    expect(onChange).toHaveBeenCalledWith('auto');
    expect(trigger()).toHaveAccessibleName('Approval: Read only');
    rerender(
      <MessageComposer
        endControls={
          <MessageComposerSelect label="Approval" options={options.slice(2)} value="missing" />
        }
      />,
    );
    expect(trigger()).toHaveAccessibleName('Approval: Read only');
  });
});
