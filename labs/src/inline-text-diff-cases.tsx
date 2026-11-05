// Inline Text Diff cases for the excerpt's context and run limits and the final view's text sources.

import { useState } from 'react';
import {
  createInlineTextDiffExcerpt,
  createInlineWordDiff,
  type TextDiffExcerptOptions,
} from '../../src/components/inline-text-diff/index.js';
import { InlineTextDiff } from '../../src/components/inline-text-diff/inline-text-diff.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** A long value with accents and emoji: the limits count code points, so no emoji is split. */
const menuStart = 'Menu du café 🍎🍐: crème brûlée, tarte aux pommes 🥧 et ';
const menuEnd = ' — servi avec un thé vert 🍵 ou un café noir ☕ à volonté.';
const menuBefore = `${menuStart}glace à la vanille 🍦${menuEnd}`;
const menuAfter = `${menuStart}sorbet au citron 🍋${menuEnd}`;

const limitOptions = (fallback: string) => [
  { value: 'default', label: `Default (${fallback})` },
  { value: '0', label: '0' },
  { value: '6', label: '6' },
];

const limit = (value: string) => (value === 'default' ? undefined : Number(value));

function ExcerptLimits() {
  const [context, setContext] = useState('default');
  const [run, setRun] = useState('default');
  const options: TextDiffExcerptOptions = { context: limit(context), run: limit(run) };
  const segments = createInlineTextDiffExcerpt(menuBefore, menuAfter, options);
  return (
    <div data-lab-demo="excerpt-limits">
      <p>
        Before: {menuBefore}
        <br />
        After: {menuAfter}
      </p>
      <SegmentedChoice
        aria-label="Context"
        size="sm"
        sizing="content"
        options={limitOptions('24')}
        value={context}
        onChange={(value) => setContext(String(value))}
      />{' '}
      <SegmentedChoice
        aria-label="Run"
        size="sm"
        sizing="content"
        options={limitOptions('100')}
        value={run}
        onChange={(value) => setRun(String(value))}
      />
      <p>
        Excerpt: <InlineTextDiff segments={segments} />
      </p>
      <LabOutput name="segments">
        {segments.map((segment) => `${segment.kind}: ${segment.text}`).join(' | ')}
      </LabOutput>
    </div>
  );
}

const orchardBefore =
  'Every crate leaves the orchard at dawn, packed with red apples, and reaches the market by noon.';
const orchardAfter =
  'Every crate leaves the orchard at dawn, packed with green pears, and reaches the market by noon.';

function FinalTextSources() {
  const excerpt = createInlineTextDiffExcerpt(orchardBefore, orchardAfter, { context: 12 });
  const words = createInlineWordDiff(orchardBefore, orchardAfter);
  const rows = [
    {
      name: 'excerpt with finalText',
      diff: <InlineTextDiff segments={excerpt} view="final" finalText={orchardAfter} />,
    },
    { name: 'excerpt without finalText', diff: <InlineTextDiff segments={excerpt} view="final" /> },
    { name: 'word diff without finalText', diff: <InlineTextDiff segments={words} view="final" /> },
  ];
  return (
    <div data-lab-demo="final-sources">
      <p>
        Changes, excerpt: <InlineTextDiff segments={excerpt} />
      </p>
      <p>
        Changes, word diff: <InlineTextDiff segments={words} />
      </p>
      <dl>
        {rows.map((row) => (
          <div key={row.name} data-lab-final={row.name}>
            <dt>Final, {row.name}</dt>
            <dd>{row.diff}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function InlineTextDiffCases() {
  return (
    <div data-lab-family="inline-text-diff-cases">
      <LabSection
        title="Excerpt limits"
        description="createInlineTextDiffExcerpt keeps context characters of unchanged text on each side and run characters of each changed run, counted in code points so accents and emoji stay whole. Pick each limit: 0 keeps nothing of that part and adds no ellipsis; the readout lists the resulting segments."
      >
        <ExcerptLimits />
      </LabSection>
      <LabSection
        title="Final text sources"
        description="The final view shows finalText when given. An excerpt cuts its context, so it needs finalText for the whole value; without it the view joins the cut segments. An uncut createInlineWordDiff result already holds the whole value, so its final view needs no finalText."
      >
        <FinalTextSources />
      </LabSection>
    </div>
  );
}
