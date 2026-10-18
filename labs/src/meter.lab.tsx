import { useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Meter } from '../../src/components/meter/meter.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const column = (width: number): CSSProperties => ({ width });

const thresholdCases = {
  'low is best': { label: 'Disk used', low: 60, high: 85, optimum: 0 },
  'high is best': { label: 'Battery', low: 20, high: 50, optimum: 100 },
  'middle is best': { label: 'Humidity', low: 40, high: 60, optimum: 50 },
} as const;

function SteppedDisk() {
  const [used, setUsed] = useState(50);
  return (
    <div style={column(280)} data-lab-demo="disk">
      <Meter
        label="Disk used"
        value={used}
        low={60}
        high={85}
        optimum={0}
        valueLabel={`${used} of 100 GB`}
      />
      <p>
        <Button size="sm" isDisabled={used === 0} onPress={() => setUsed(used - 10)}>
          Free 10 GB
        </Button>{' '}
        <Button size="sm" isDisabled={used === 100} onPress={() => setUsed(used + 10)}>
          Use 10 GB
        </Button>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Sizes and values"
      description="Every size at an empty, a partial and a full value, each in a 200px column."
    >
      <StateMatrix
        axes={{ value: ['0', '40', '100'], size: ['sm', 'md', 'lg'] }}
        render={({ value, size }) => (
          <div style={column(200)}>
            <Meter label="Storage" size={size} value={Number(value)} />
          </div>
        )}
      />
    </LabSection>
    <LabSection title="Tones" description="Each tone the caller sets.">
      <StateMatrix
        axes={{ tone: ['neutral', 'success', 'warning', 'danger'] }}
        render={({ tone }) => (
          <div style={column(200)}>
            <Meter label="Score" tone={tone} value={70} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Labels and value text"
      description="A visible label or only an accessible name, a unit format, a worded value and a hidden value."
    >
      <StateMatrix
        axes={{
          option: ['visible label', 'aria-label only', 'unit', 'value label', 'value hidden'],
        }}
        render={({ option }) => (
          <div style={column(160)}>
            <Meter
              value={40}
              maxValue={option === 'unit' ? 128 : 100}
              {...(option === 'aria-label only'
                ? { 'aria-label': 'Storage' }
                : { label: 'Storage' })}
              {...(option === 'unit'
                ? { formatOptions: { style: 'unit', unit: 'gigabyte' } as const }
                : {})}
              {...(option === 'value label' ? { valueLabel: '40 of 100 photos' } : {})}
              showValueLabel={option !== 'value hidden'}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Thresholds"
      description="Tones judged by low, high and optimum: a low, a middle and a high value against each kind of optimum."
    >
      <StateMatrix
        axes={{
          optimum: Object.keys(thresholdCases) as Array<keyof typeof thresholdCases>,
          value: ['10', '55', '90'],
        }}
        render={({ optimum, value }) => {
          const { label, ...thresholds } = thresholdCases[optimum];
          return (
            <div style={column(200)}>
              <Meter label={label} value={Number(value)} {...thresholds} />
            </div>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Stepping a value"
      description="Use and free space: the tone turns from success to warning past 60 GB and to danger past 85 GB."
    >
      <SteppedDisk />
    </LabSection>
  </>,
);
