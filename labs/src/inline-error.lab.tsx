import { useState } from 'react';
import { InlineError } from '../../src/components/inline-error/inline-error.js';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const outcomes = {
  succeeds: 'Succeeds',
  rejects: 'Rejects',
  throws: 'Throws at once',
} as const;

type Outcome = keyof typeof outcomes;

const isOutcome = (value: unknown): value is Outcome =>
  typeof value === 'string' && Object.hasOwn(outcomes, value);

/** A retry that succeeds, rejects after a delay or throws before it starts, as the reader chooses. */
function retryWith(outcome: Outcome): () => Promise<void> | void {
  if (outcome === 'throws') {
    return () => {
      throw new Error('No connection');
    };
  }
  return async () => {
    await wait(600);
    if (outcome === 'rejects') throw new Error('The weather service timed out');
  };
}

function RecoveryDemo() {
  const [failed, setFailed] = useState(true);
  const [outcome, setOutcome] = useState<Outcome>('succeeds');
  const [attempts, setAttempts] = useState(0);
  const [successes, setSuccesses] = useState(0);
  const [lastError, setLastError] = useState('none');
  const retry = retryWith(outcome);
  return (
    <div data-lab-demo="recovery">
      <SegmentedChoice
        aria-label="Next retry"
        size="sm"
        sizing="content"
        options={Object.entries(outcomes).map(([value, label]) => ({ value, label }))}
        value={outcome}
        onChange={(value) => {
          if (isOutcome(value)) setOutcome(value);
        }}
      />
      {failed ? (
        <InlineError
          data-lab-error="recovery"
          onRetry={async () => {
            setAttempts((count) => count + 1);
            await retry();
            setSuccesses((count) => count + 1);
            setFailed(false);
          }}
          onRetryError={(error) => setLastError(error instanceof Error ? error.message : 'unknown')}
        >
          Could not load the weather for Oslo.
        </InlineError>
      ) : (
        <p data-lab-output="loaded">
          Oslo: 4 °C, light rain.{' '}
          <Button size="sm" variant="tertiary" onPress={() => setFailed(true)}>
            Fail again
          </Button>
        </p>
      )}
      <p>
        Attempts: <output data-lab-output="tries">{attempts}</output>
      </p>
      <p>
        Successful retries: <output data-lab-output="attempts">{successes}</output>
      </p>
      <p>
        Last error from onRetryError: <output data-lab-output="error">{lastError}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Recovery and width"
      description="Each case in a 280px and a 480px container. The recovery button moves below the message when it cannot fit beside it."
    >
      <StateMatrix
        axes={{
          recovery: ['none', 'retry', 'long label', 'disabled'],
          width: ['280', '480'],
        }}
        render={({ recovery, width }) => (
          <div style={{ width: Number(width) }}>
            <InlineError
              onRetry={recovery === 'none' ? undefined : () => {}}
              retryLabel={recovery === 'long label' ? 'Reload the current versions' : undefined}
              isRetryDisabled={recovery === 'disabled'}
            >
              The file could not be saved.
            </InlineError>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Rich messages and host text"
      description="Validation lists keep their structure; the message inherits the host's font size."
    >
      <StateMatrix
        axes={{ message: ['list', 'small host text'] }}
        render={({ message }) => (
          <div style={{ width: 320 }}>
            {message === 'list' ? (
              <InlineError>
                <ul>
                  <li>Choose a folder.</li>
                  <li>Enter a name.</li>
                </ul>
              </InlineError>
            ) : (
              <div style={{ fontSize: 11 }}>
                <InlineError>Name is required.</InlineError>
              </div>
            )}
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Tones and pending checks"
      description="Danger is an assertive alert; warning, success and a check still running are polite statuses with their own glyph or spinner."
    >
      <StateMatrix
        axes={{ tone: ['danger', 'warning', 'success'], state: ['settled', 'pending'] }}
        render={({ tone, state }) => (
          <div style={{ width: 280 }}>
            <InlineError tone={tone} isPending={state === 'pending'}>
              {state === 'pending'
                ? 'Checking the name…'
                : tone === 'danger'
                  ? 'The name is taken.'
                  : tone === 'warning'
                    ? 'The name is long.'
                    : 'The name is free.'}
            </InlineError>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Retry lifecycle"
      description="Choose what the next retry does. The retry button stays pending while the request runs; success replaces the error with content. A rejection, or an error thrown before the request starts, reaches onRetryError: the error stays, the button stops pending and the next retry can succeed."
    >
      <RecoveryDemo />
    </LabSection>
  </>,
);
