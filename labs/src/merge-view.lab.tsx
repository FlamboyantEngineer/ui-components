import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { MergeView, type MergeViewResult } from '../../src/components/merge-view/merge-view.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { ShadowRootApp } from './shadow-root-host.js';

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
const insertedSection = Array.from({ length: 24 }, (_, index) => `Step ${index + 1}`).join('\n');

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

function RecipeMerge() {
  const [result, setResult] = useState<MergeViewResult | null>(null);
  const [showBase, setShowBase] = useState(true);
  return (
    <>
      <Switch isSelected={showBase} onChange={setShowBase}>
        Show the original
      </Switch>
      <MergeView
        aria-label="Recipe merge"
        base={base}
        ours={ours}
        theirs={theirs}
        oursLabel="My edits"
        baseLabel="Original"
        theirsLabel="Shared copy"
        showBase={showBase}
        onChange={setResult}
        data-lab-field="recipe"
      />
      <Output name="unresolved" value={result ? String(result.unresolved) : 'none yet'} />
      <Output name="resolutions" value={result ? result.resolutions.join(', ') : 'none yet'} />
      <pre data-lab-output="text">{result?.text ?? ''}</pre>
    </>
  );
}

/** Two unrelated merges in turn, as a panel reused for the next file shows them. */
const queuedMerges = [
  { name: 'Pancakes', base: 'Use 2 eggs.', ours: 'Use 3 eggs.', theirs: 'Use 1 egg.' },
  {
    name: 'Flatbread',
    base: 'Rest for 1 hour.',
    ours: 'Rest for 2 hours.',
    theirs: 'Rest overnight.',
  },
];

function QueuedMerge() {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<MergeViewResult | null>(null);
  const merge = queuedMerges[index % queuedMerges.length] ?? queuedMerges[0];
  if (!merge) return null;
  return (
    <>
      <Button
        onPress={() => {
          setIndex(index + 1);
          setResult(null);
        }}
      >
        Next merge
      </Button>
      <MergeView
        aria-label={`${merge.name} merge`}
        base={merge.base}
        ours={merge.ours}
        theirs={merge.theirs}
        onChange={setResult}
        data-lab-field="queued"
      />
      <pre data-lab-output="queued-text">{result?.text ?? ''}</pre>
    </>
  );
}

/** Our side turns a line into a blank line between paragraphs, which taking ours keeps. */
function BlankLineMerge() {
  const [result, setResult] = useState<MergeViewResult | null>(null);
  return (
    <>
      <MergeView
        aria-label="Blank line merge"
        base={'Morning rota\nTea break at 10\nCheck the stores'}
        ours={'Morning rota\n\nCheck the stores'}
        theirs={'Morning rota\nCoffee break at 10\nCheck the stores'}
        onChange={setResult}
        data-lab-field="blank"
      />
      <Output name="blank-text" value={result ? JSON.stringify(result.text) : 'none yet'} />
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
      description="Take a side, both or the base for each conflict, or edit its result; Next conflict and Previous conflict move between them and the count announces what is left. The result text updates below. Each pane takes its own label: My edits, Original and Shared copy; Show the original hides and shows the base pane, and the labels stay."
    >
      <RecipeMerge />
    </LabSection>
    <LabSection
      title="Replacing the texts"
      description="Next merge shows another set of texts in the same view: every conflict starts over unresolved, and undo in its editor never brings back the previous merge's text."
    >
      <QueuedMerge />
    </LabSection>
    <LabSection
      title="Blank lines"
      description="Our side replaced a line with a blank line. Taking ours keeps that blank line in the result, shown below as a string; typing in the result and then clearing it removes the line instead."
    >
      <BlankLineMerge />
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
    <LabSection
      title="An inserted section"
      description="A whole section added to an empty text is one clean change, and every line appears in the result."
    >
      <MergeView aria-label="Inserted section merge" base="" ours={insertedSection} theirs="" />
    </LabSection>
    <LabSection
      title="Inside a shadow root"
      description="The same merge inside an open shadow root, as a web component holds it: Next conflict and Previous conflict still move focus into each conflict's result."
    >
      <ShadowRootApp demo="shadow-merge">
        <MergeView aria-label="Shadow merge" base={base} ours={ours} theirs={theirs} />
      </ShadowRootApp>
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left page the panes run from the right, and the current conflict is marked on the start edge of its lines. Step to the next conflict to mark it."
    >
      <div dir="rtl" data-lab-demo="rtl">
        <MergeView aria-label="Right to left merge" base={base} ours={ours} theirs={theirs} />
      </div>
    </LabSection>
  </>,
);
