import { useState } from 'react';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import { ZoomControl, type ZoomPreset } from '../../src/components/zoom-control/zoom-control.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const levels = [50, 75, 100, 125, 150, 200];
const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const states = [
  'default',
  'first level',
  'last level',
  'between levels',
  'reset',
  'presets',
  'disabled',
] as const;

const fitPresets: readonly ZoomPreset[] = [
  { id: 'fit-width', label: 'Fit width' },
  { id: 'fit-page', label: 'Fit page' },
];

/** What the lab's stage would need to fit its page, in percent. */
const fitZoom: Record<string, number> = { 'fit-width': 137.5, 'fit-page': 82 };

const startValue: Record<(typeof states)[number], number> = {
  default: 100,
  'first level': 50,
  'last level': 200,
  'between levels': 137.5,
  reset: 150,
  presets: 100,
  disabled: 100,
};

function Requested() {
  const [zoom, setZoom] = useState(100);
  const [log, setLog] = useState<number[]>([]);
  return (
    <div data-lab-case="requested">
      <ZoomControl
        aria-label="Canvas zoom"
        levels={[200, 50, 125, 100, 75, 150, 100, Number.NaN, Infinity]}
        value={zoom}
        resetValue={100}
        onChange={(next) => {
          setZoom(next);
          setLog((entries) => [...entries.slice(-4), next]);
        }}
      />
      <p>
        Applied zoom: <output data-lab-output="zoom">{zoom}</output>; requests:{' '}
        <output data-lab-output="log">{log.join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

function Presets() {
  const [zoom, setZoom] = useState(100);
  const [last, setLast] = useState('none');
  return (
    <div data-lab-case="presets">
      <ZoomControl
        aria-label="Page zoom with presets"
        levels={levels}
        value={zoom}
        presets={[...fitPresets, 50, 100, 200]}
        onChange={(next) => {
          setZoom(next);
          setLast(`${next}%`);
        }}
        onPresetAction={(id) => {
          setZoom(fitZoom[id] ?? 100);
          setLast(id);
        }}
      />
      <p>
        Applied zoom: <output data-lab-output="zoom">{zoom}</output>; last choice:{' '}
        <output data-lab-output="last">{last}</output>
      </p>
    </div>
  );
}

function CallerSteps() {
  const [zoom, setZoom] = useState(100);
  const [commands, setCommands] = useState<string[]>([]);
  const run = (name: string, next: number | undefined) => {
    if (next === undefined) return;
    setZoom(next);
    setCommands((entries) => [...entries.slice(-3), name]);
  };
  const index = levels.indexOf(zoom);
  return (
    <div data-lab-case="caller-steps">
      <ZoomControl
        aria-label="Page zoom"
        levels={levels}
        value={zoom}
        onChange={setZoom}
        zoomOutButton={
          <IconButton
            icon="minus"
            label="Shrink page"
            size="sm"
            isDisabled={index <= 0}
            onPress={() => run('shrink', levels[index - 1])}
          />
        }
        zoomInButton={
          <IconButton
            icon="plus"
            label="Grow page"
            size="sm"
            isDisabled={index >= levels.length - 1}
            onPress={() => run('grow', levels[index + 1])}
          />
        }
      />
      <p>
        Commands: <output data-lab-output="commands">{commands.join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Sizes and states"
      description="Levels 50–200%. Each cell is uncontrolled and starts at the state it names."
    >
      <StateMatrix
        axes={{ state: states, size: sizes }}
        render={({ state, size }) => (
          <ZoomControl
            aria-label={`Zoom ${state} ${size}`}
            levels={levels}
            defaultValue={startValue[state]}
            size={size}
            isDisabled={state === 'disabled'}
            {...(state === 'reset' ? { resetValue: 100 } : {})}
            {...(state === 'presets' || state === 'disabled' ? { presets: [50, 100, 200] } : {})}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Requested levels"
      description="A controlled control: unordered levels, duplicates and non-finite entries share one normalised ladder. The buttons, slider (arrow keys, Home, End) and reset request levels that the lab applies."
    >
      <Requested />
    </LabSection>
    <LabSection
      title="Preset menu"
      description="The menu after the value requests a percentage or reports a named preset, which the lab resolves to the zoom that fits its stage."
    >
      <Presets />
    </LabSection>
    <LabSection
      title="Caller step buttons"
      description="The caller owns the step buttons; the control keeps the slider and the percentage."
    >
      <CallerSteps />
    </LabSection>
  </>,
);
