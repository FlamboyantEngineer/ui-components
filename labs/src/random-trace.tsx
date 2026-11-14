// A live Sparkline of a random signal that wanders and keeps moving, for the Sparkline lab.

import { useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Sparkline } from '../../src/components/sparkline/sparkline.js';
import { LabOutput } from './lab-output.js';

/** How often a sample is taken, in milliseconds. */
const sampleInterval = 250;
/** How many samples the trace keeps: 20 seconds at four samples a second. */
const traceLength = 80;
/** The signal's range: it wanders inside it and is pulled back toward the middle. */
const lowest = 0;
const highest = 100;
const middle = (lowest + highest) / 2;

/**
 * The next sample of a random walk: a random step, a pull back toward the middle so the trace never
 * settles at an edge, and an occasional jump so it does not look like noise around one value.
 */
function nextSample(previous: number, random: () => number): number {
  const step = (random() - 0.5) * 16;
  const pull = (middle - previous) * 0.06;
  const jump = random() < 0.05 ? (random() - 0.5) * 50 : 0;
  const next = previous + step + pull + jump;
  return Math.round(Math.min(highest, Math.max(lowest, next)));
}

/** Appends `sample` to the trace, keeping its last `traceLength` samples. */
function append(trace: readonly number[], sample: number): number[] {
  return [...trace, sample].slice(-traceLength);
}

/** Appends a random sample every `sampleInterval` while `isRunning`. */
function useRandomTrace(isRunning: boolean) {
  const [trace, setTrace] = useState<readonly number[]>([middle]);
  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = setInterval(() => {
      setTrace((current) => append(current, nextSample(current.at(-1) ?? middle, Math.random)));
    }, sampleInterval);
    return () => clearInterval(timer);
  }, [isRunning]);
  return trace;
}

/** The live trace with its current reading and a pause button. */
export function RandomTrace() {
  const [isRunning, setRunning] = useState(true);
  const trace = useRandomTrace(isRunning);
  return (
    <div data-lab-demo="random-trace">
      <Sparkline
        aria-label="Random signal, last 20 seconds"
        values={trace}
        variant="area"
        markers={['last']}
        minValue={lowest}
        maxValue={highest}
        width={240}
        height={48}
      />
      <LabOutput name="reading">
        {isRunning ? `Current value ${String(trace.at(-1) ?? middle)}` : 'Paused'}
      </LabOutput>
      <Button size="sm" onPress={() => setRunning((running) => !running)}>
        {isRunning ? 'Pause trace' : 'Resume trace'}
      </Button>
    </div>
  );
}
