import { useState } from 'react';
import { InlineError } from '../../src/components/inline-error/inline-error.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function RecoveryDemo() {
  const [failed, setFailed] = useState(true);
  const [attempts, setAttempts] = useState(0);
  return (
    <div data-lab-demo="recovery">
      {failed ? (
        <InlineError
          data-lab-error="recovery"
          onRetry={async () => {
            await wait(600);
            setAttempts((count) => count + 1);
            setFailed(false);
          }}
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
        Successful retries: <output data-lab-output="attempts">{attempts}</output>
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
      title="Retry lifecycle"
      description="The retry button stays pending while the request runs; success replaces the error with content."
    >
      <RecoveryDemo />
    </LabSection>
  </>,
);
