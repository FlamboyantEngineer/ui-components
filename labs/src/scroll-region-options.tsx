import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { ScrollRegion } from '../../src/components/scroll-region/scroll-region.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const fruit = [
  'Apples',
  'Apricots',
  'Bananas',
  'Cherries',
  'Damsons',
  'Figs',
  'Grapes',
  'Kiwis',
  'Lemons',
  'Mangoes',
  'Oranges',
  'Pears',
];

// Lab-only host: a bounded flex column, so fill and clip have a box to act in.
const host = (width: number, height: number): CSSProperties => ({
  width,
  height,
  display: 'flex',
  flexDirection: 'column',
  outline: '1px dotted currentColor',
});

const delays = { '200 ms': 200, '600 ms': 600, '2 s': 2000 } as const;
type Delay = keyof typeof delays;

/** Logs when the region's scrolling and hovering states start and end, with the time since. */
function HideDelayDemo() {
  const [delay, setDelay] = useState<Delay>('600 ms');
  const [visibility, setVisibility] = useState<'scroll' | 'hover'>('scroll');
  const [log, setLog] = useState<string[]>([]);
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = hostRef.current?.querySelector('.ui-scroll-region');
    if (!root) return;
    const started = performance.now();
    const seen = { scrolling: false, hovering: false };
    const observer = new MutationObserver(() => {
      for (const name of ['scrolling', 'hovering'] as const) {
        const isOn = root.hasAttribute(`data-${name}`);
        if (isOn === seen[name]) continue;
        seen[name] = isOn;
        const elapsed = Math.round(performance.now() - started);
        setLog((current) => [...current, `${name} ${isOn ? 'on' : 'off'} (${elapsed} ms)`]);
      }
    });
    observer.observe(root, { attributes: true });
    return () => observer.disconnect();
  }, [delay, visibility]);
  return (
    <div data-lab-demo="hide-delay">
      <div role="group" aria-label="Scrollbar timing">
        <SegmentedChoice
          aria-label="Hide delay"
          sizing="content"
          options={Object.keys(delays).map((value) => ({ value, label: value }))}
          value={delay}
          onChange={(value) => {
            setDelay((value as Delay | null) ?? '600 ms');
            setLog([]);
          }}
        />
        <SegmentedChoice
          aria-label="Show scrollbars"
          sizing="content"
          options={[
            { value: 'scroll', label: 'While scrolling' },
            { value: 'hover', label: 'While hovered' },
          ]}
          value={visibility}
          onChange={(value) => {
            setVisibility(value === 'hover' ? 'hover' : 'scroll');
            setLog([]);
          }}
        />
      </div>
      <div ref={hostRef} style={host(220, 120)}>
        <ScrollRegion
          key={`${delay} ${visibility}`}
          scrollbar="overlay"
          scrollbarVisibility={visibility}
          scrollbarHideDelay={delays[delay]}
          role="region"
          aria-label="Fruit, timed scrollbars"
          tabIndex={0}
        >
          <ol style={{ margin: 0 }}>
            {fruit.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ol>
        </ScrollRegion>
      </div>
      <p>
        Hide delay: <output data-lab-output="delay">{delays[delay]} ms</output>
      </p>
      <ol aria-label="Scrollbar states" data-lab-output="states">
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}

export function ScrollRegionOptionCases() {
  return (
    <>
      <LabSection
        title="Scrollbar hide delay"
        description="Overlay thumbs shown while scrolling or while hovered stay for scrollbarHideDelay after the last scroll or after the pointer leaves. Scroll the list (wheel, or focus it and press the arrow keys) or hover it, then stop: the log notes when each state starts and ends."
      >
        <HideDelayDemo />
      </LabSection>
      <LabSection
        title="Fill and clip"
        description="A horizontal region in a positioned 220 by 120 pixel host: fill makes it cover its containing block, clip cuts the content that does not fit instead of letting it spill."
      >
        <StateMatrix
          axes={{ fill: ['off', 'on'], clip: ['off', 'on'] }}
          render={({ fill, clip }) => (
            <div style={{ ...host(220, 120), position: 'relative', marginBottom: 24 }}>
              <ScrollRegion
                axis="x"
                fill={fill === 'on'}
                clip={clip === 'on'}
                role="region"
                aria-label={`Fruit, fill ${fill}, clip ${clip}`}
                tabIndex={0}
                data-lab-containment={`${fill} ${clip}`}
              >
                <p style={{ margin: 0, width: 360, height: 160 }}>
                  A tall and wide paragraph about fruit that reaches past both edges of its host.
                </p>
              </ScrollRegion>
            </div>
          )}
        />
      </LabSection>
      <LabSection
        title="Fit columns, gaps and alignment"
        description="A region of fit columns in a 320 by 140 pixel host: each minimum column width against the gap, then each alignment of two columns of cells with different heights."
      >
        <StateMatrix
          axes={{
            minColumnWidth: ['sm', 'md', 'lg', 'xl'] as const,
            space: ['none', 'xs', 'md'] as const,
          }}
          render={({ minColumnWidth, space }) => (
            <div style={host(320, 140)}>
              <ScrollRegion
                columns="fit"
                minColumnWidth={minColumnWidth}
                space={space}
                role="region"
                aria-label={`Fruit, ${minColumnWidth} columns, ${space} gap`}
                tabIndex={0}
                data-lab-fit={`${minColumnWidth} ${space}`}
              >
                {fruit.map((name) => (
                  <span key={name}>{name}</span>
                ))}
              </ScrollRegion>
            </div>
          )}
        />
        <StateMatrix
          axes={{ align: ['stretch', 'start', 'center', 'end', 'baseline'] as const }}
          render={({ align }) => (
            <div style={host(320, 140)}>
              <ScrollRegion
                columns={2}
                align={align}
                space="xs"
                role="region"
                aria-label={`Fruit, ${align} cells`}
                tabIndex={0}
                data-lab-align={align}
              >
                <span style={{ outline: '1px dotted currentColor' }}>
                  Apples
                  <br />
                  and pears
                </span>
                <span style={{ outline: '1px dotted currentColor' }}>Figs</span>
              </ScrollRegion>
            </div>
          )}
        />
      </LabSection>
    </>
  );
}
