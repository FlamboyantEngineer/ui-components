import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { deepActive, inShadow, ShadowHost } from '../../../test/shadow-fixtures.js';
import { Section, type SectionProps } from './section-header.js';

// Turning collapsibility on or off keeps the content (UIC-SECTION-HEADER-2.3).

function Draft({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return <input aria-label="Draft" defaultValue="" />;
}

function setup(initial: Partial<SectionProps>) {
  const onMount = vi.fn();
  const tree = (props: Partial<SectionProps>) => (
    <Section title="Details" {...props}>
      <Draft onMount={onMount} />
      <Section title="Inner">Nested</Section>
    </Section>
  );
  const view = render(tree(initial));
  return { onMount, rerender: (props: Partial<SectionProps>) => view.rerender(tree(props)) };
}

const draft = () => screen.getByRole('textbox', { name: 'Draft' });

describe('Section collapsibility changes', () => {
  it('UIC-SECTION-HEADER-2.3 keeps the content, its draft and focus when collapsible comes and goes', async () => {
    const user = userEvent.setup();
    const { onMount, rerender } = setup({});
    await user.type(draft(), 'unsaved');
    const input = draft();
    rerender({ collapsible: true });
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Inner' })).toHaveProperty('tagName', 'H4');
    rerender({ collapsible: false });
    expect(screen.queryByRole('button', { name: 'Details' })).not.toBeInTheDocument();
    expect(draft()).toBe(input);
    expect(input).toHaveValue('unsaved');
    expect(input).toHaveFocus();
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it('UIC-SECTION-HEADER-2.3 moves focus to the trigger when the change hides the focused content', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { onMount, rerender } = setup({ isExpanded: false, onExpandedChange });
    await user.type(draft(), 'unsaved');
    const input = draft();
    rerender({ collapsible: true, isExpanded: false, onExpandedChange });
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(input.closest('.ui-section__panel')).toHaveAttribute('hidden');
    await user.keyboard('{Enter}');
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    rerender({ collapsible: true, isExpanded: true, onExpandedChange });
    expect(input).toHaveValue('unsaved');
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it('UIC-SECTION-HEADER-2.3 moves focus to the trigger from hidden content inside a shadow root', () => {
    const tree = (isExpanded: boolean) => (
      <ShadowHost name="page">
        <Section title="Details" collapsible isExpanded={isExpanded}>
          <input aria-label="Draft" />
        </Section>
      </ShadowHost>
    );
    const { rerender } = render(tree(true));
    inShadow('page').getByRole('textbox', { name: 'Draft' }).focus();
    rerender(tree(false));
    expect(deepActive()).toBe(inShadow('page').getByRole('button', { name: 'Details' }));
  });

  it('UIC-SECTION-HEADER-2.3 keeps an uncontrolled default when collapsible turns on', async () => {
    const user = userEvent.setup();
    const { rerender } = setup({ defaultExpanded: false });
    expect(draft()).toBeVisible();
    rerender({ collapsible: true, defaultExpanded: false });
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(draft()).toBeVisible();
  });
});
