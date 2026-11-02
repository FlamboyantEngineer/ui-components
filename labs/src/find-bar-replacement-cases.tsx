import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { FindBar } from '../../src/components/find-bar/find-bar.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const startingText = 'Stir the jam, jar the jam, then label each jam jar.';

/** The indices of each whole-word `jam`, the only query this bar finds. */
function findJam(text: string): number[] {
  return [...text.matchAll(/\bjam\b/g)].map((found) => found.index);
}

/** A bar whose replacement text the page owns: presets and a reset from outside the bar. */
function HostReplacement() {
  const [text, setText] = useState(startingText);
  const [replacement, setReplacement] = useState('');
  const [reports, setReports] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const matches = findJam(text);
  const index = matches.length > 0 ? Math.min(current, matches.length - 1) : -1;
  const log = (entry: string) => setReports((list) => [...list, entry]);
  return (
    <div data-lab-demo="host-replacement">
      <Button size="sm" variant="secondary" onPress={() => setReplacement('marmalade')}>
        Preset: marmalade
      </Button>{' '}
      <Button size="sm" variant="secondary" onPress={() => setReplacement('')}>
        Reset the replacement
      </Button>{' '}
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          setText(startingText);
          setReports([]);
        }}
      >
        Restore the text
      </Button>
      <FindBar
        label="Find jam"
        query="jam"
        matchCount={matches.length}
        currentIndex={index}
        onNext={() => setCurrent((index + 1) % matches.length)}
        onPrevious={() => setCurrent((index - 1 + matches.length) % matches.length)}
        replacement={replacement}
        onReplacementChange={(next) => {
          setReplacement(next);
          log(`typed: ${next}`);
        }}
        onReplace={(value) => {
          const start = matches[index];
          if (start === undefined) return;
          setText(text.slice(0, start) + value + text.slice(start + 3));
          log(`replace: ${value}`);
        }}
        onReplaceAll={(value) => {
          setText(text.replace(/\bjam\b/g, value));
          log(`replace all: ${value}`);
        }}
      />
      <p data-lab-text="">{text}</p>
      <LabOutput name="replacement">{JSON.stringify(replacement)}</LabOutput>
      <ol data-lab-output="reports">
        {reports.map((entry, position) => (
          <li key={position}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}

export function FindBarReplacementCases() {
  return (
    <LabSection
      title="Replacement the page owns"
      description="replacement and onReplacementChange put the replacement text in the page's hands: the presets set and reset it from outside, typing reports each change, and Replace and Replace all use whatever the page holds at that moment."
    >
      <HostReplacement />
    </LabSection>
  );
}
