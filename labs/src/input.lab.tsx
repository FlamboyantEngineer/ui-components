import { Input } from '../../src/components/input/input.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

mountLab(
  <LabSection title="Native input">
    <StateMatrix
      axes={{ state: ['default', 'disabled', 'read-only', 'invalid'] }}
      render={({ state }) => (
        <Input
          aria-label={`Reference (${state})`}
          name="reference"
          defaultValue={state === 'default' ? '' : 'TN-246'}
          placeholder="TN-246"
          disabled={state === 'disabled'}
          readOnly={state === 'read-only'}
          aria-invalid={state === 'invalid' || undefined}
          size={14}
        />
      )}
    />
  </LabSection>,
);
