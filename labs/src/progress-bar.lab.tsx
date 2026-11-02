import { ProgressMeterCases } from './progress-meter-cases.js';
import { ProgressRangeCases } from './progress-range-cases.js';
import { ProgressRingCases } from './progress-ring-cases.js';
import { ProgressSegmentCases } from './progress-segment-cases.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ProgressBar, Spinner } from '../../src/components/progress-bar/progress-bar.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;
const states = ['empty', 'partial', 'complete', 'indeterminate'] as const;
const values: Record<(typeof states)[number], number> = {
  empty: 0,
  partial: 40,
  complete: 100,
  indeterminate: 0,
};

function CountProgress() {
  const total = 5;
  const [done, setDone] = useState(2);
  return (
    <div data-lab-demo="count" style={{ width: 280 }}>
      <ProgressBar
        label="Copied files"
        value={done}
        maxValue={total}
        valueLabel={`${done}/${total}`}
      />
      <p>
        <Button size="sm" isDisabled={done === 0} onPress={() => setDone((value) => value - 1)}>
          Step back
        </Button>{' '}
        <Button size="sm" isDisabled={done === total} onPress={() => setDone((value) => value + 1)}>
          Step forward
        </Button>
      </p>
    </div>
  );
}

mountLab(
  <>
    <div data-lab-family="progress-bar-main">
      <LabSection
        title="Sizes and states"
        description="Every size with empty, partial, complete and indeterminate progress, each in a 200px column."
      >
        <StateMatrix
          axes={{ state: states, size: sizes }}
          render={({ state, size }) => (
            <div style={{ width: 200 }}>
              <ProgressBar
                label="Uploading"
                size={size}
                value={values[state]}
                isIndeterminate={state === 'indeterminate'}
              />
            </div>
          )}
        />
      </LabSection>
      <LabSection
        title="Labels and value text"
        description="A visible label or only an accessible name, a worded value, and a hidden value."
      >
        <StateMatrix
          axes={{ option: ['visible label', 'aria-label only', 'value label', 'value hidden'] }}
          render={({ option }) => (
            <div style={{ width: 200 }}>
              <ProgressBar
                value={2}
                maxValue={3}
                {...(option === 'aria-label only'
                  ? { 'aria-label': 'Completed' }
                  : { label: 'Completed' })}
                {...(option === 'value label' ? { valueLabel: '2 of 3 files' } : {})}
                showValueLabel={option !== 'value hidden'}
              />
            </div>
          )}
        />
      </LabSection>
      <LabSection
        title="Truthful edges"
        description="An empty total, a value above the total and a negative value."
      >
        <StateMatrix
          axes={{ count: ['0/0', '7/3', '-1/3'] }}
          render={({ count }) => {
            const [value = 0, total = 0] = count.split('/').map(Number);
            return (
              <div style={{ width: 200 }}>
                <ProgressBar aria-label={`Count ${count}`} value={value} maxValue={total} />
              </div>
            );
          }}
        />
      </LabSection>
      <LabSection
        title="Status"
        description="Each tone, measured and indeterminate; a full bar also publishes completion."
      >
        <StateMatrix
          axes={{ tone: ['neutral', 'success', 'warning', 'danger'], progress: ['60%', '100%'] }}
          render={({ tone, progress }) => (
            <div style={{ width: 200 }}>
              <ProgressBar
                label={tone === 'danger' ? 'Upload failed' : 'Uploading'}
                tone={tone}
                value={Number.parseInt(progress, 10)}
              />
            </div>
          )}
        />
      </LabSection>
      <LabSection title="Count progress" description="Step a count toward its total and back.">
        <CountProgress />
      </LabSection>
      <LabSection
        title="Spinner"
        description="The decorative busy glyph at each size, leading a busy line."
      >
        <StateMatrix
          axes={{ size: sizes }}
          render={({ size }) => (
            <span aria-busy="true">
              <Spinner size={size} /> Writing a summary
            </span>
          )}
        />
      </LabSection>
      <LabSection
        title="Standalone spinner"
        description="With a label, the spinner stands alone as a named, indeterminate progress bar."
      >
        <StateMatrix
          axes={{ standalone: sizes }}
          render={({ standalone }) => <Spinner size={standalone} label="Loading recipes" />}
        />
      </LabSection>
      <LabSection
        title="Named spinner in a sentence"
        description="A labelled spinner stays an inline glyph, so it can sit within a line of text."
      >
        <p>
          Fetching the next page <Spinner size="sm" label="Loading results" /> of results
        </p>
      </LabSection>
    </div>

    <LabSection
      title="Shape and meaning"
      description="A work indicator or measured quantity, as a linear track or circular ring. Meter thresholds judge storage; it never becomes indeterminate or complete."
    >
      <StateMatrix
        axes={{ mode: ['progress', 'meter'], shape: ['linear', 'circular'] }}
        render={({ mode, shape }) => (
          <div style={{ width: 200 }}>
            <ProgressBar
              mode={mode}
              shape={shape}
              label={mode === 'meter' ? 'Storage' : 'Uploading'}
              value={60}
              low={20}
              high={80}
              optimum={50}
              showValueLabel
            />
          </div>
        )}
      />
    </LabSection>
    <ProgressSegmentCases />
    <ProgressRingCases />
    <ProgressMeterCases />
    <ProgressRangeCases />
    <LabSection
      title="Right to left"
      description="In a right-to-left page the fill starts at the right edge, and the indeterminate fill travels left, with the reading."
    >
      <div dir="rtl" style={{ display: 'grid', gap: 12, width: 200 }} data-lab-demo="rtl">
        <ProgressBar label="Uploading" value={40} showValueLabel />
        <ProgressBar label="Uploading" isIndeterminate />
      </div>
    </LabSection>
  </>,
);
