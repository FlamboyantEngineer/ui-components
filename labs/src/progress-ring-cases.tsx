import { ProgressBar } from '../../src/components/progress-bar/progress-bar.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;
const states = ['0%', '42%', '100%', 'indeterminate'] as const;

export function ProgressRingCases() {
  return (
    <div data-lab-family="progress-ring-cases">
      <>
        <LabSection
          title="Circular: Sizes and values"
          description="Empty, partial, full and indeterminate rings."
        >
          <StateMatrix
            axes={{ state: states, size: sizes }}
            render={({ state, size }) => (
              <ProgressBar
                shape="circular"
                aria-label={`Completed ${state}`}
                size={size}
                value={state === 'indeterminate' ? 0 : Number.parseInt(state, 10)}
                isIndeterminate={state === 'indeterminate'}
              />
            )}
          />
        </LabSection>
        <LabSection
          title="Circular: Labels and value text"
          description="An accessible name only, a visible label, and the value text beside the ring."
        >
          <StateMatrix
            axes={{ option: ['aria-label only', 'visible label', 'value text', 'value label'] }}
            render={({ option }) => (
              <ProgressBar
                shape="circular"
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
        <LabSection
          title="Circular: Status"
          description="Each tone on a partial ring, and a full ring that publishes completion."
        >
          <StateMatrix
            axes={{ tone: ['neutral', 'success', 'warning', 'danger'], progress: ['60%', '100%'] }}
            render={({ tone, progress }) => (
              <ProgressBar
                shape="circular"
                aria-label={`Synced ${progress}`}
                tone={tone}
                value={Number.parseInt(progress, 10)}
              />
            )}
          />
        </LabSection>
      </>
    </div>
  );
}
