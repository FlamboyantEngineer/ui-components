import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactNode, useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Section } from '../section-header/section-header.js';
import { Card } from './card.js';
import { CardTitle } from './card-parts.js';

// The body keeps its identity and the outline whatever the title does (UIC-CARD-1.2, UIC-CARD-1.4).

function Draft({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return <input aria-label="Draft" defaultValue="" />;
}

describe('Card body and headings', () => {
  it('UIC-CARD-1.2 keeps the body mounted while a title arrives, leaves or becomes a custom header', async () => {
    const user = userEvent.setup();
    const onMount = vi.fn();
    const card = (props: { title?: ReactNode; header?: ReactNode }) => (
      <Card {...props}>
        <Draft onMount={onMount} />
      </Card>
    );
    const { rerender } = render(card({}));
    await user.type(screen.getByRole('textbox', { name: 'Draft' }), 'unsaved');
    const input = screen.getByRole('textbox', { name: 'Draft' });
    rerender(card({ title: 'Loaded title' }));
    rerender(card({ header: <CardTitle>Custom</CardTitle> }));
    rerender(card({}));
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(input);
    expect(input).toHaveValue('unsaved');
    expect(input).toHaveFocus();
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it('UIC-CARD-1.4 nests body sections below a slotted title, and untitled cards inherit', () => {
    render(
      <>
        <Card headingLevel={4} header={<CardTitle>Outer</CardTitle>}>
          <Section title="Inner">Body</Section>
        </Card>
        <Section title="Page">
          <Card>
            <Section title="Untitled child">Body</Section>
          </Card>
          <Card title="Deep" headingLevel={6}>
            <Section title="Clamped">Body</Section>
          </Card>
        </Section>
      </>,
    );
    expect(screen.getByRole('heading', { name: 'Outer' })).toHaveProperty('tagName', 'H4');
    expect(screen.getByRole('heading', { name: 'Inner' })).toHaveProperty('tagName', 'H5');
    expect(screen.getByRole('heading', { name: 'Page' })).toHaveProperty('tagName', 'H3');
    expect(screen.getByRole('heading', { name: 'Untitled child' })).toHaveProperty('tagName', 'H4');
    expect(screen.getByRole('heading', { name: 'Clamped' })).toHaveProperty('tagName', 'H6');
  });
});
