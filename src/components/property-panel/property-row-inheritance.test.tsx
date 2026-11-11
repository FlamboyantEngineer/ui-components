import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { PropertyRow } from './property-row.js';

const inherited = { value: '16 px', source: 'from Body text' };

function SizeRow() {
  const [own, setOwn] = useState<string | undefined>('');
  return (
    <PropertyRow
      label="Size"
      htmlFor="size"
      inherited={inherited}
      isOverridden={own !== undefined}
      onReset={() => setOwn(undefined)}
    >
      <input
        id="size"
        value={own ?? ''}
        placeholder={inherited.value}
        onChange={(event) => setOwn(event.target.value)}
      />
    </PropertyRow>
  );
}

describe('PropertyRow inheritance', () => {
  it('UIC-PROPERTY-PANEL-3.7 shows the inherited value and its source after the control', () => {
    const { container } = render(
      <PropertyRow label="Size" inherited={inherited}>
        <input aria-label="Size value" />
      </PropertyRow>,
    );
    const shown = container.querySelector('.ui-property-row__inherited') as HTMLElement;
    expect(shown.previousElementSibling).toHaveClass('ui-property-row__control');
    expect(shown).toHaveTextContent(/^Inherited 16 px from Body text$/);
    expect(
      screen.queryByRole('button', { name: 'Reset to inherited value' }),
    ).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', {
      slots: [
        'ui-property-row__label',
        'ui-property-row__control',
        'ui-property-row__inherited',
        'ui-property-row__inherited-label',
        'ui-property-row__inherited-value',
        'ui-property-row__inherited-source',
      ],
    });
  });

  it('UIC-PROPERTY-PANEL-3.7 leaves the source out when none is given', () => {
    const { container } = render(
      <PropertyRow label="Size" inherited={{ value: 'Auto' }}>
        <input aria-label="Size value" />
      </PropertyRow>,
    );
    expect(container.querySelector('.ui-property-row__inherited-source')).toBeNull();
    expect(container.querySelector('.ui-property-row__inherited')).toHaveTextContent(
      /^Inherited Auto$/,
    );
  });

  it('UIC-PROPERTY-PANEL-3.7 offers a reset described by the label only while overridden', () => {
    const onReset = vi.fn();
    const { rerender } = render(
      <PropertyRow label="Size" inherited={inherited} onReset={onReset}>
        <input aria-label="Size value" />
      </PropertyRow>,
    );
    expect(
      screen.queryByRole('button', { name: 'Reset to inherited value' }),
    ).not.toBeInTheDocument();
    rerender(
      <PropertyRow label="Size" inherited={inherited} onReset={onReset} isOverridden>
        <input aria-label="Size value" />
      </PropertyRow>,
    );
    const reset = screen.getByRole('button', { name: 'Reset to inherited value' });
    expect(reset).toHaveClass('ui-property-row__reset');
    expect(reset).toHaveAccessibleDescription('Size');
  });

  it('UIC-PROPERTY-PANEL-3.7 keeps an explicit empty value as an override until reset', async () => {
    const user = userEvent.setup();
    render(<SizeRow />);
    const field = screen.getByRole('textbox', { name: 'Size' });
    expect(field).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Reset to inherited value' }));
    expect(
      screen.queryByRole('button', { name: 'Reset to inherited value' }),
    ).not.toBeInTheDocument();
    await user.type(field, '12');
    expect(field).toHaveValue('12');
    expect(screen.getByRole('button', { name: 'Reset to inherited value' })).toBeVisible();
  });
});
