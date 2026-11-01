// A live Sparkline of the browser's measured rendering frame rate, for the Sparkline lab.

import { useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Sparkline } from '../../src/components/sparkline/sparkline.js';
import { LabOutput } from './lab-output.js';

/** How often a sample is taken, in milliseconds. */
const sampleInterval = 500;
/** How many samples the trace keeps: 30 seconds at two samples a second. */
const traceLength = 60;
/**
 * A wait between two frames longer than this means the page stopped drawing (a background tab or
 * a stalled thread): the window is dropped and the trace shows a gap instead of a catch-up spike.
 */
const stallGap = 1000;

/** Appends `sample` to the trace, keeping its last `traceLength` samples. */
function append(trace: readonly number[], sample: number): number[] {
  return [...trace, sample].slice(-traceLength);
}

/** A gap in the trace, unless it already ends in one. */
function appendGap(trace: readonly number[]): readonly number[] {
  return trace.length === 0 || Number.isNaN(trace.at(-1)) ? trace : append(trace, Number.NaN);
}

/**
 * Counts `requestAnimationFrame` callbacks while `isRunning` and appends one frames-per-second
 * sample every `sampleInterval`, measured from the frames' own timestamps.
 */
function useFrameRateTrace(isRunning: boolean) {
  const [trace, setTrace] = useState<readonly number[]>([]);
  useEffect(() => {
    if (!isRunning) return undefined;
    let windowStart: number | null = null;
    let previous: number | null = null;
    let frames = 0;
    let request = 0;
    const onFrame = (time: number) => {
      if (previous !== null && time - previous > stallGap) {
        windowStart = null;
        setTrace(appendGap);
      }
      previous = time;
      if (windowStart === null) {
        windowStart = time;
        frames = 0;
      } else {
        frames += 1;
        const elapsed = time - windowStart;
        if (elapsed >= sampleInterval) {
          const sample = Math.round((frames * 1000) / elapsed);
          setTrace((current) => append(current, sample));
          windowStart = time;
          frames = 0;
        }
      }
      request = requestAnimationFrame(onFrame);
    };
    request = requestAnimationFrame(onFrame);
    return () => {
      cancelAnimationFrame(request);
      // A resumed trace starts after a gap, so the pause shows as one.
      setTrace(appendGap);
    };
  }, [isRunning]);
  return trace;
}

/** The live trace with its current reading and a pause button. */
export function FrameRateTrace() {
  const [isRunning, setRunning] = useState(true);
  const trace = useFrameRateTrace(isRunning);
  const last = trace.at(-1);
  const highest = Math.max(60, ...trace.filter(Number.isFinite));
  return (
    <div data-lab-demo="frame-rate">
      <Sparkline
        aria-label="Browser frame rate, last 30 seconds"
        values={trace}
        variant="area"
        markers={['last']}
        minValue={0}
        maxValue={highest}
        width={240}
        height={48}
      />
      <LabOutput name="frame rate">
        {!isRunning
          ? 'Paused'
          : last === undefined || Number.isNaN(last)
            ? 'Measuring'
            : `${last} frames per second`}
      </LabOutput>
      <Button size="sm" onPress={() => setRunning((running) => !running)}>
        {isRunning ? 'Pause trace' : 'Resume trace'}
      </Button>
    </div>
  );
}
