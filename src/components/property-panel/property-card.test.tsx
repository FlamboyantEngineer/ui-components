import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UndoGlyph } from '../../core/glyphs.js';
import { Button } from '../button/button.js';
import { PropertyCard } from './property-card.js';
import { PropertyRow } from './property-row.js';

function slots(...names: string[]) {
  return names.map((name) => `ui-property-card__${name}`);
}

describe('PropertyCard', () => {
  it('UIC-PROPERTY-PANEL-2.6 is a closed disclosure with a name, a summary and actions outside its trigger', async () => {
    const onPress = vi.fn();
    const { container } = render(
      <PropertyCard
        name="Heading"
        summary="Serif 22"
        actions={<Button icon={UndoGlyph} label="Reset heading" onPress={onPress} />}
      >
        <PropertyRow label="Font">Serif</PropertyRow>
      </PropertyCard>,
    );
    const root = container.firstElementChild as HTMLElement;
    const trigger = screen.getByRole('button', { name: 'Heading Serif 22' });
    expect(root).toHaveClass('ui-property-card');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'chevron-right');
    expect(container.querySelector('.ui-property-card__name')).toHaveTextContent('Heading');
    expect(container.querySelector('.ui-property-card__summary')).toHaveTextContent('Serif 22');
    const body = container.querySelector('.ui-property-card__body') as HTMLElement;
    expect(body).toHaveAttribute('hidden');
    expect(screen.getByText('Font')).toBeInTheDocument();
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', {
      slots: slots('header', 'trigger', 'chevron', 'name', 'summary', 'actions', 'body'),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Reset heading' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(root).toHaveAttribute('data-expanded', 'true');
    expect(body).not.toHaveAttribute('hidden');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL');
  });

  it('UIC-PROPERTY-PANEL-2.6 opens by default or under control', async () => {
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <PropertyCard name="Body" defaultExpanded>
        <PropertyRow label="Size">11</PropertyRow>
      </PropertyCard>,
    );
    expect(screen.getByRole('button', { name: 'Body' })).toHaveAttribute('aria-expanded', 'true');
    rerender(
      <PropertyCard name="Body" isExpanded={false} onExpandedChange={onExpandedChange}>
        <PropertyRow label="Size">11</PropertyRow>
      </PropertyCard>,
    );
    const trigger = screen.getByRole('button', { name: 'Body' });
    await userEvent.click(trigger);
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-PROPERTY-PANEL-2.7 marks a card that overrides a value or holds an overridden row', () => {
    const { container, rerender } = render(
      <PropertyCard name="Caption" isOverridden>
        <PropertyRow label="Size">9</PropertyRow>
      </PropertyCard>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-overridden', 'true');
    expect(screen.getByRole('img', { name: 'Contains overridden values' })).toHaveClass(
      'ui-property-card__override',
    );
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', { slots: slots('override') });

    rerender(
      <PropertyCard name="Caption">
        <PropertyRow label="Size" isOverridden>
          9
        </PropertyRow>
      </PropertyCard>,
    );
    expect(root).toHaveAttribute('data-overridden', 'true');

    rerender(
      <PropertyCard name="Caption">
        <PropertyRow label="Size">9</PropertyRow>
      </PropertyCard>,
    );
    expect(root).not.toHaveAttribute('data-overridden');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
