import { CircularProgress } from '../../src/components/circular-progress/circular-progress.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;
const states = ['0%', '42%', '100%', 'indeterminate'] as const;

mountLab(
  <>
    <LabSection
      title="Sizes and values"
      description="Empty, partial, full and indeterminate rings."
    >
      <StateMatrix
        axes={{ state: states, size: sizes }}
        render={({ state, size }) => (
          <CircularProgress
            aria-label={`Completed ${state}`}
            size={size}
            value={state === 'indeterminate' ? 0 : Number.parseInt(state, 10)}
            isIndeterminate={state === 'indeterminate'}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Labels and value text"
      description="An accessible name only, a visible label, and the value text beside the ring."
    >
      <StateMatrix
        axes={{ option: ['aria-label only', 'visible label', 'value text', 'value label'] }}
        render={({ option }) => (
          <CircularProgress
            value={3}
            maxValue={4}
            {...(option === 'aria-label only'
              ? { 'aria-label': 'Completed' }
              : { label: 'Completed' })}
            showValueLabel={option === 'value text' || option === 'value label'}
            {...(option === 'value label' ? { valueLabel: '3 of 4' } : {})}
          />
        )}
      />
    </LabSection>
  </>,
);
