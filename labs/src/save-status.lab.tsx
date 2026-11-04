import { useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SaveStatus, type SaveStatusPhase } from '../../src/components/save-status/save-status.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const phases: readonly SaveStatusPhase[] = ['idle', 'dirty', 'saving', 'saved', 'error', 'offline'];

/**
 * A small editor that saves a second after each edit; every third save fails until retried, and
 * the saved label fades after two seconds.
 */
function AutosaveDemo() {
  const [text, setText] = useState('Grocery list: apples, pears');
  const [phase, setPhase] = useState<SaveStatusPhase>('idle');
  const saves = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const save = () => {
    setPhase('saving');
    timer.current = setTimeout(() => {
      saves.current += 1;
      setPhase(saves.current % 3 === 0 ? 'error' : 'saved');
    }, 800);
  };
  return (
    <div data-lab-demo="autosave">
      <label>
        Notes{' '}
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setPhase('dirty');
            clearTimeout(timer.current);
            timer.current = setTimeout(save, 1000);
          }}
        />
      </label>{' '}
      <SaveStatus
        phase={phase}
        hideSavedAfter={2000}
        onRetry={save}
        labels={{ error: 'Not saved: the connection dropped' }}
      />
    </div>
  );
}

/** Steps through the phases by hand, to hear each announcement. */
function PhaseStepper() {
  const [index, setIndex] = useState(0);
  const phase = phases[index] ?? 'idle';
  return (
    <div data-lab-demo="stepper">
      <Button size="sm" onPress={() => setIndex((index + 1) % phases.length)}>
        Next phase
      </Button>{' '}
      <SaveStatus phase={phase} onRetry={() => setIndex(2)} />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Phases"
      description="Every phase with the provider's labels, with and without a retry handler; idle shows nothing."
    >
      <StateMatrix
        axes={{ phase: phases, retry: ['no retry', 'retry'] }}
        render={({ phase, retry }) => (
          <SaveStatus phase={phase} onRetry={retry === 'retry' ? () => {} : undefined} />
        )}
      />
    </LabSection>
    <LabSection
      title="Labels and truncation"
      description="A caller label for a failed save, cut in a 140px band with the full text in a tooltip."
    >
      <StateMatrix
        axes={{ width: ['wide', '140px'] }}
        render={({ width }) => (
          <div style={{ width: width === 'wide' ? 560 : 140 }}>
            <SaveStatus
              phase="error"
              labels={{ error: 'Not saved: the server is busy, try again in a minute' }}
              onRetry={() => {}}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Autosave"
      description="Type to edit: unsaved, then saving, then saved, which fades after two seconds. Every third save fails; Retry saves again."
    >
      <AutosaveDemo />
    </LabSection>
    <LabSection
      title="Announcements"
      description="Each press moves to the next phase; a screen reader announces the new label politely."
    >
      <PhaseStepper />
    </LabSection>
  </>,
);
