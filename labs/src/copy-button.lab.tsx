import { useState } from 'react';
import { CopyButton } from '../../src/components/copy-button/copy-button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const states = ['rest', 'disabled'] as const;

function CopyDemo() {
  const [outcome, setOutcome] = useState('none');
  return (
    <div data-lab-demo="copy">
      <p>
        <code data-lab-value="">ORD-2026-0417</code>{' '}
        <CopyButton
          value="ORD-2026-0417"
          label="Copy the order number"
          onCopy={(copied) => setOutcome(copied ? 'copied' : 'refused')}
        />
      </p>
      <p data-lab-output="outcome">Last copy: {outcome}</p>
      <p>
        <label>
          Paste here <input data-lab-paste="" />
        </label>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants, sizes and states"
      description="Any Icon Button variant and size; a disabled button never copies."
    >
      <StateMatrix
        axes={{ state: states, variant: ['ghost', 'secondary'], size: ['xs', 'sm', 'md', 'lg'] }}
        render={({ state, variant, size }) => (
          <CopyButton
            value="Lisbon"
            variant={variant}
            size={size}
            isDisabled={state === 'disabled'}
            label={`Copy Lisbon (${variant}, ${size}, ${state})`}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Copying"
      description="Press the button: it copies the order number, shows a check mark and announces Copied for two seconds."
    >
      <CopyDemo />
    </LabSection>
  </>,
);
