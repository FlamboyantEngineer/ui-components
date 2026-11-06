import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Meter, ProgressBar, resolveMeterTone } from '../../src/components/progress-bar/index.js';
import { LabSection, StateMatrix } from './chrome/index.js';

/** Two ranges that do not start at zero, one above it and one across it, each with three values. */
const ranges = {
  '200 to 800': { minValue: 200, maxValue: 800, values: { below: 100, within: 350, above: 900 } },
  '-50 to 50': { minValue: -50, maxValue: 50, values: { below: -80, within: 25, above: 70 } },
} as const;

const kinds = ['linear', 'circular', 'meter'] as const;

/** A bar whose root the caller renders, showing the values it receives as they change. */
function RenderedRoot() {
  const [value, setValue] = useState(30);
  const [isIndeterminate, setIndeterminate] = useState(false);
  const [refTarget, setRefTarget] = useState('not read');
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div data-lab-demo="render" style={{ width: 280 }}>
      <ProgressBar
        ref={ref}
        label="Importing photos"
        value={value}
        isIndeterminate={isIndeterminate}
        data-lab-bar="rendered"
        render={(props, values) => (
          <div {...props} data-lab-rendered="true">
            {props.children}
            <span aria-hidden="true" data-lab-output="values">
              percentage {values.percentage ?? 'none'} · value text {values.valueText ?? 'none'}
              {' · '}
              {values.isIndeterminate ? 'indeterminate' : 'measured'}
            </span>
          </div>
        )}
      />
      <p>
        <Button size="sm" isDisabled={value === 0} onPress={() => setValue(value - 10)}>
          Less
        </Button>{' '}
        <Button size="sm" isDisabled={value === 100} onPress={() => setValue(value + 10)}>
          More
        </Button>{' '}
        <Button size="sm" onPress={() => setIndeterminate(!isIndeterminate)}>
          {isIndeterminate ? 'Measure it' : 'Stop measuring'}
        </Button>{' '}
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            const node = ref.current;
            setRefTarget(node ? `${node.tagName.toLowerCase()}.${node.className}` : 'none');
          }}
        >
          Read the ref
        </Button>
      </p>
      <p>
        The ref holds: <output data-lab-output="ref">{refTarget}</output>
      </p>
    </div>
  );
}

const thresholds = { low: 60, high: 85, optimum: 0 } as const;

/** A meter stepped through its thresholds beside what resolveMeterTone returns for the same value. */
function MeterToneHelper() {
  const [used, setUsed] = useState(50);
  const tone = resolveMeterTone({ value: used, minValue: 0, maxValue: 100 }, thresholds);
  return (
    <div data-lab-demo="meter-tone" style={{ width: 280 }}>
      <Meter label="Disk used" value={used} {...thresholds} valueLabel={`${used} of 100 GB`} />
      <p>
        <Button size="sm" isDisabled={used === 0} onPress={() => setUsed(used - 10)}>
          Free 10 GB
        </Button>{' '}
        <Button size="sm" isDisabled={used === 100} onPress={() => setUsed(used + 10)}>
          Use 10 GB
        </Button>
      </p>
      <p>
        <code>
          resolveMeterTone({`{ value: ${used}, minValue: 0, maxValue: 100 }`},{' '}
          {'{ low: 60, high: 85, optimum: 0 }'})
        </code>{' '}
        → <output data-lab-output="tone">{tone ?? 'undefined'}</output>
      </p>
    </div>
  );
}

export function ProgressRangeCases() {
  return (
    <div data-lab-family="progress-range-cases">
      <LabSection
        title="Shifted ranges"
        description="Ranges that start above zero and below it. A value below the range reads 0%, one above it 100%, and one within it its share of the range: 350 of 200 to 800 reads 25%, 25 of -50 to 50 reads 75%, linear, circular and as a meter."
      >
        <StateMatrix
          axes={{
            range: Object.keys(ranges) as (keyof typeof ranges)[],
            value: ['below', 'within', 'above'],
            kind: kinds,
          }}
          render={({ range, value, kind }) => {
            const { values, ...bounds } = ranges[range];
            const props = {
              label: `${values[value]} of ${range}`,
              value: values[value],
              ...bounds,
              showValueLabel: true,
            };
            return (
              <div style={{ width: 160 }}>
                {kind === 'meter' ? <Meter {...props} /> : <ProgressBar {...props} shape={kind} />}
              </div>
            );
          }}
        />
      </LabSection>
      <LabSection
        title="Rendering the root"
        description="The caller renders the root through render, spreading the props it receives (hooks, ref and accessibility) and showing the values it gets: change the value or stop measuring and the readout follows. Read the ref: it holds the caller's element."
      >
        <RenderedRoot />
      </LabSection>
      <LabSection
        title="Meter tone helper"
        description="The tone resolveMeterTone gives each value, beside the meter that draws it: success up to 60 GB, warning to 85 GB and danger beyond, as data-tone shows."
      >
        <MeterToneHelper />
      </LabSection>
    </div>
  );
}
