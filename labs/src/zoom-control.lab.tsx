import { useState } from 'react';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import { ZoomControl } from '../../src/components/zoom-control/zoom-control.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const levels = [50, 75, 100, 125, 150, 200];
const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const states = [
  'default',
  'first level',
  'last level',
  'between levels',
  'reset',
  'disabled',
] as const;

const startValue: Record<(typeof states)[number], number> = {
  default: 100,
  'first level': 50,
  'last level': 200,
  'between levels': 137.5,
  reset: 150,
  disabled: 100,
};

function Requested() {
  const [zoom, setZoom] = useState(100);
  const [log, setLog] = useState<number[]>([]);
  return (
    <div data-lab-case="requested">
      <ZoomControl
        aria-label="Canvas zoom"
        levels={levels}
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
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Requested levels"
      description="A controlled control: the buttons, the slider (arrow keys, Home, End) and reset request levels that the lab applies."
    >
      <Requested />
    </LabSection>
    <LabSection
      title="Caller step buttons"
      description="The caller owns the step buttons; the control keeps the slider and the percentage."
    >
      <CallerSteps />
    </LabSection>
  </>,
);
