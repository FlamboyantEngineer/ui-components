import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  MiniApp,
  type MiniAppError,
  type MiniAppSource,
  type MiniAppState,
} from '../../src/components/mini-app/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { bodeSource, projectileSource } from './mini-app-plot-samples.js';
import { calculatorSource, chartSource, outcomeSources } from './mini-app-samples.js';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** The host lends one capability and counts the calls it answers. */
function CalculatorDemo() {
  const [calls, setCalls] = useState(0);
  const [saved, setSaved] = useState<MiniAppState>(null);
  return (
    <div data-lab-demo="calculator" style={{ display: 'grid', gap: 8 }}>
      <MiniApp
        title="Loan payment calculator"
        source={calculatorSource}
        capabilities={{
          formatMoney: (value) => {
            setCalls((count) => count + 1);
            return money.format(Number(value));
          },
        }}
        onStateChange={setSaved}
      />
      <p>
        Host answered <output data-lab-output="calls">{calls}</output> formatMoney calls; saved
        inputs: <output data-lab-output="calculator-state">{JSON.stringify(saved)}</output>
      </p>
    </div>
  );
}

/** The host keeps the chart's state and passes it back when the chart restarts. */
function ChartDemo() {
  const [saved, setSaved] = useState<MiniAppState>({ year: 'previous', threshold: 50 });
  const [run, setRun] = useState(0);
  return (
    <div data-lab-demo="chart" style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
      <MiniApp
        key={run}
        title="Monthly visitors chart"
        source={chartSource}
        initialState={saved}
        onStateChange={setSaved}
      />
      <p>
        Saved state: <output data-lab-output="chart-state">{JSON.stringify(saved)}</output>
      </p>
      <Button onPress={() => setRun((count) => count + 1)}>Restart chart</Button>
    </div>
  );
}

/** A mini-app that reports the state it saves, for the engineering and physics samples. */
function SavedStateDemo({
  name,
  title,
  source,
}: {
  name: string;
  title: string;
  source: MiniAppSource;
}) {
  const [saved, setSaved] = useState<MiniAppState>(null);
  return (
    <div data-lab-demo={name} style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
      <MiniApp title={title} source={source} onStateChange={setSaved} />
      <p>
        Saved state: <output data-lab-output="state">{JSON.stringify(saved)}</output>
      </p>
    </div>
  );
}

function OutcomeCell({ outcome }: { outcome: keyof typeof outcomeSources }) {
  const [error, setError] = useState<MiniAppError>();
  return (
    <div style={{ display: 'grid', gap: 4, width: 220 }}>
      <MiniApp
        title={`Sample: ${outcome}`}
        source={outcomeSources[outcome]}
        readyTimeout={outcome === 'timeout' ? 0 : undefined}
        onError={setError}
      />
      <output data-lab-output="error">
        {error ? `${error.kind}: ${error.message}` : 'No error'}
      </output>
    </div>
  );
}

/** Prints the origins the mini-app's policy lets it fetch from. */
const policySource: MiniAppSource = {
  html: '<main aria-labelledby="title"><h1 id="title">Reach</h1><p id="reach">Reading…</p></main>',
  script: `const policy = document.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
const connect = policy.split(';').map((part) => part.trim()).find((part) => part.startsWith('connect-src'));
document.getElementById('reach').textContent = connect || 'connect-src none';`,
};

/** A mini-app given an origin to reach or none, which restarts it, and whose loads the host counts. */
function NetworkDemo() {
  const [allowsCdn, setAllowsCdn] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  return (
    <div data-lab-demo="network" style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
      <Button onPress={() => setAllowsCdn(!allowsCdn)}>
        {allowsCdn ? 'Reach no network' : 'Allow https://cdn.example.org'}
      </Button>
      <MiniApp
        title="Network reach"
        source={policySource}
        allowedOrigins={allowsCdn ? ['https://cdn.example.org'] : undefined}
        onReady={() => setReadyCount((count) => count + 1)}
      />
      <p>
        Ready: <output data-lab-output="ready">{String(readyCount)}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Calculator"
      description="A self-contained loan calculator with its own inputs, button and output. It runs in a sandboxed frame, asks the host to format money through the formatMoney capability, and saves its inputs through onStateChange."
    >
      <CalculatorDemo />
    </LabSection>
    <LabSection
      title="Interactive chart and restored state"
      description="An SVG bar chart with a year switch and a threshold slider. Each change is saved to the host; Restart chart remounts it, and it starts from the saved state. The frame follows its content's height."
    >
      <ChartDemo />
    </LabSection>
    <LabSection
      title="Engineering chart"
      description="A Bode plot of a second-order low-pass filter on a logarithmic frequency axis. Sliders set the cutoff frequency and damping ratio; the probe slider, or the pointer over the plot, reads gain and phase at any frequency."
    >
      <SavedStateDemo name="bode" title="Low-pass filter Bode plot" source={bodeSource} />
    </LabSection>
    <LabSection
      title="Physics calculator"
      description="A projectile flown in a vacuum and through air with quadratic drag, integrated step by step. Speed, angle, height, ball size and world update the trajectory plot and the results table as they change."
    >
      <SavedStateDemo name="projectile" title="Projectile calculator" source={projectileSource} />
    </LabSection>
    <LabSection
      title="Outcomes"
      description="Each instance runs on its own channel. A script that throws before it is ready, or a mini-app that is not ready within readyTimeout (0 here), fails: the frame is hidden and the status says it could not run. A mini-app that navigates its frame fails too, and its frame is removed."
    >
      <StateMatrix
        axes={{ outcome: ['ready', 'script error', 'timeout', 'navigation'] }}
        render={({ outcome }) => <OutcomeCell outcome={outcome} />}
      />
    </LabSection>
    <LabSection
      title="Network and readiness"
      description="Without allowed origins the mini-app reaches no network; allowing one origin restarts it with that origin in its policy, which it prints. onReady counts each start."
    >
      <NetworkDemo />
    </LabSection>
  </>,
);
