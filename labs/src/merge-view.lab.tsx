import { useState } from 'react';
import { MergeView, type MergeViewResult } from '../../src/components/merge-view/merge-view.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const base = [
  'Lemon tart',
  'Serves 8',
  '',
  'Rub the butter into the flour.',
  'Stir in the sugar and one egg yolk.',
  'Chill the pastry for 30 minutes.',
  'Bake the shell blind for 15 minutes.',
  'Whisk four eggs with the lemon juice.',
  'Bake for 25 minutes until just set.',
].join('\n');

const ours = [
  'Lemon tart',
  'Serves 10',
  '',
  'Rub the butter into the flour.',
  'Stir in the sugar and one egg yolk.',
  'Chill the pastry for 45 minutes.',
  'Bake the shell blind for 15 minutes.',
  'Whisk five eggs with the lemon juice.',
  'Bake for 25 minutes until just set.',
  'Dust with icing sugar.',
].join('\n');

const theirs = [
  'Lemon and lime tart',
  'Serves 12',
  '',
  'Rub the butter into the flour.',
  'Stir in the sugar and one egg yolk.',
  'Chill the pastry for 30 minutes.',
  'Bake the shell blind for 20 minutes.',
  'Whisk four eggs with the lemon and lime juice.',
  'Add the zest of two limes.',
  'Bake for 25 minutes until just set.',
  'Serve with whipped cream.',
].join('\n');

const sensors = ['harbour', 'bridge', 'station', 'tower', 'pier', 'lock'] as const;

/** A settings file of one block per sensor; each side retunes some of the values. */
const settings = (edit: (sensor: number, key: string, value: number) => number) =>
  sensors
    .flatMap((sensor, index) => [
      `[${sensor}]`,
      `interval = ${edit(index, 'interval', 30)}`,
      `retries = ${edit(index, 'retries', 3)}`,
      `timeout = ${edit(index, 'timeout', 10)}`,
      `buffer = ${edit(index, 'buffer', 256)}`,
      '',
    ])
    .join('\n');

const settingsBase = settings((_, __, value) => value);
const settingsOurs = settings((sensor, key, value) =>
  key === 'interval' && sensor % 2 === 0 ? value / 2 : value,
);
const settingsTheirs = settings((sensor, key, value) => {
  if (key === 'buffer' && sensor % 3 === 0) return value * 2;
  return key === 'interval' && sensor === 2 ? value * 2 : value;
});

const contents = {
  conflicts: [base, ours, theirs],
  clean: ['one\ntwo\nthree', 'one\nTWO\nthree', 'one\ntwo\nthree\nfour'],
  identical: ['one\ntwo', 'one\ntwo', 'one\ntwo'],
} as const;
const contentNames = Object.keys(contents) as Array<keyof typeof contents>;

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

function RecipeMerge() {
  const [result, setResult] = useState<MergeViewResult | null>(null);
  return (
    <>
      <MergeView
        aria-label="Recipe merge"
        base={base}
        ours={ours}
        theirs={theirs}
        oursLabel="My edits"
        theirsLabel="Shared copy"
        onChange={setResult}
        data-lab-field="recipe"
      />
      <Output name="unresolved" value={result ? String(result.unresolved) : 'none yet'} />
      <Output name="resolutions" value={result ? result.resolutions.join(', ') : 'none yet'} />
      <pre data-lab-output="text">{result?.text ?? ''}</pre>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Conflicts to resolve, clean changes only and identical texts, with and without the base pane."
    >
      <StateMatrix
        axes={{ content: contentNames, base: ['shown', 'hidden'] }}
        render={({ content, base: shown }) => {
          const [baseText, oursText, theirsText] = contents[content];
          return (
            <MergeView
              aria-label={`${content}, base ${shown}`}
              base={baseText}
              ours={oursText}
              theirs={theirsText}
              showBase={shown === 'shown'}
            />
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Resolving conflicts"
      description="Take a side, both or the base for each conflict, or edit its result; Next conflict and Previous conflict move between them and the count announces what is left. The result text updates below."
    >
      <RecipeMerge />
    </LabSection>
    <LabSection
      title="Scrolling together"
      description="A longer settings file: scroll any pane and the others follow, chunk by chunk."
    >
      <MergeView
        aria-label="Settings merge"
        base={settingsBase}
        ours={settingsOurs}
        theirs={settingsTheirs}
        data-lab-field="settings"
      />
    </LabSection>
  </>,
);
