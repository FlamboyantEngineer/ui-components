import { Textarea } from '../../src/components/textarea/textarea.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

mountLab(
  <LabSection title="Native textarea">
    <StateMatrix
      axes={{ state: ['default', 'disabled', 'read-only', 'invalid'] }}
      render={({ state }) => (
        <Textarea
          aria-label={`Notes (${state})`}
          name="notes"
          defaultValue={state === 'default' ? '' : 'Update on Friday'}
          placeholder="Add notes"
          disabled={state === 'disabled'}
          readOnly={state === 'read-only'}
          aria-invalid={state === 'invalid' || undefined}
          rows={3}
          cols={16}
        />
      )}
    />
  </LabSection>,
);
