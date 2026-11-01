import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { Fieldset } from '../field/field.js';
import { RelativeDateField } from './relative-date-field.js';

describe('RelativeDateField locking', () => {
  const getNow = () => new Date(2026, 4, 23, 10, 30, 0);
  const within = (element: ReactElement) => <UiProvider locale="en-US">{element}</UiProvider>;

  it.each([
    ['its own isDisabled', (locked: boolean) => ({ isDisabled: locked }), false],
    ['its own isReadOnly', (locked: boolean) => ({ isReadOnly: locked }), false],
    ['a disabled fieldset', () => ({}), true],
  ])(
    'UIC-RELATIVE-DATE-FIELD-1.4 closes the open presets for good under %s',
    async (_, lockProps, viaFieldset) => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const onCommit = vi.fn();
      const field = (locked: boolean) => {
        const element = (
          <RelativeDateField
            label="Due"
            getNow={getNow}
            onOpenChange={onOpenChange}
            onCommit={onCommit}
            {...lockProps(locked)}
          />
        );
        return within(
          viaFieldset ? (
            <Fieldset legend="Plan" isDisabled={locked}>
              {element}
            </Fieldset>
          ) : (
            element
          ),
        );
      };
      const { rerender } = render(field(false));
      const trigger = screen.getByRole('button', { name: /Due$/ });
      await user.click(trigger);
      const option = screen.getAllByRole('option')[0];
      rerender(field(true));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
      if (option) await user.click(option);
      expect(onCommit).not.toHaveBeenCalled();
      rerender(field(false));
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    },
  );
});
