import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';

interface LargeInputDemoProps {
  /** What the button loads, such as "96 KB of unmatched markers". */
  label: string;
  /** Builds the input when the button is pressed. */
  build: () => string;
  /** Draws the input. */
  children: (input: string) => ReactNode;
}

/** Loads a large adversarial input on demand and reports how long it took to draw. */
export function LargeInputDemo({ label, build, children }: LargeInputDemoProps) {
  const [input, setInput] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const started = useRef(0);
  useLayoutEffect(() => {
    if (input !== null) setElapsed(Math.round(performance.now() - started.current));
  }, [input]);
  return (
    <div data-lab-demo="large-input">
      <Button
        size="sm"
        onPress={() => {
          started.current = performance.now();
          setInput(build());
        }}
      >
        Load {label}
      </Button>{' '}
      <output data-lab-output="elapsed">
        {elapsed === null ? 'Not loaded' : `${input?.length ?? 0} characters in ${elapsed} ms`}
      </output>
      {input === null ? null : (
        // Lab-only frame: keeps the long result in a short, keyboard-scrollable box.
        <div
          role="region"
          aria-label="Large input"
          tabIndex={0}
          style={{ maxHeight: 120, overflow: 'auto', overflowWrap: 'anywhere' }}
        >
          {children(input)}
        </div>
      )}
    </div>
  );
}
