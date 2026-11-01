import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { StepListEditor, type StepListEditorStep } from './step-list-editor.js';
import { isStepDirty, readStepValue } from './step-list.js';

const field = (number: number) =>
  within(screen.getByRole('group', { name: `Step ${number}` })).getByRole('textbox', {
    name: 'Action',
  });
const stepItem = (number: number) =>
  requireDefined(screen.getByRole('group', { name: `Step ${number}` }).closest('li'));

async function runAction(user: ReturnType<typeof userEvent.setup>, number: number, name: string) {
  await user.click(screen.getByRole('button', { name: `Actions for step ${number}` }));
  await user.click(await screen.findByRole('menuitem', { name }));
}

// Menus open and close through React Aria overlays, which is slow under a loaded runner.
describe.each(['constructor', '__proto__', 'toString'])(
  'StepListEditor with a column named %s',
  { timeout: 15_000 },
  (id) => {
    const columns = [{ id, label: 'Action' }];
    const own = (text: string) => Object.fromEntries([[id, text]]);

    function Editor({ onValue }: { onValue: (steps: readonly StepListEditorStep[]) => void }) {
      const [value, setValue] = useState<readonly StepListEditorStep[]>([{ id: 'a', values: {} }]);
      return (
        <StepListEditor
          columns={columns}
          value={value}
          committedValue={[{ id: 'a', values: {} }]}
          onChange={(next) => {
            setValue(next);
            onValue(next);
          }}
        />
      );
    }

    it('UIC-STEP-LIST-EDITOR-1.4 reads a missing value as empty and edits, adds, inserts and duplicates steps', async () => {
      const user = userEvent.setup();
      const onValue = vi.fn<(steps: readonly StepListEditorStep[]) => void>();
      render(<Editor onValue={onValue} />);
      expect(field(1)).toHaveValue('');
      expect(stepItem(1)).not.toHaveAttribute('data-dirty');
      await user.click(screen.getByRole('button', { name: 'Add step' }));
      expect(field(2)).toHaveValue('');
      await runAction(user, 1, 'Insert step below');
      expect(field(2)).toHaveValue('');
      await user.type(field(1), 'Go');
      expect(onValue.mock.lastCall?.[0][0]?.values).toEqual(own('Go'));
      expect(Object.hasOwn(requireDefined(onValue.mock.lastCall?.[0][0]).values, id)).toBe(true);
      expect(stepItem(1)).toHaveAttribute('data-dirty', 'true');
      await runAction(user, 1, 'Duplicate');
      expect(field(2)).toHaveValue('Go');
    });

    it('UIC-STEP-LIST-EDITOR-1.4 UIC-STEP-LIST-EDITOR-3.1 compares own values only', () => {
      const empty = { id: 'a', values: {} };
      const set = { id: 'a', values: own('Go') };
      expect(readStepValue(empty, id)).toBe('');
      expect(readStepValue(set, id)).toBe('Go');
      expect(isStepDirty(empty, { id: 'a', values: own('') }, [id])).toBe(false);
      expect(isStepDirty(set, empty, [id])).toBe(true);
      render(<StepListEditor columns={columns} defaultValue={[set]} committedValue={[set]} />);
      expect(field(1)).toHaveValue('Go');
      expect(stepItem(1)).not.toHaveAttribute('data-dirty');
    });
  },
);
