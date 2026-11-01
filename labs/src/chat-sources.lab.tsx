import { useMemo } from 'react';
import {
  ChatCitation,
  ChatSources,
  createCitationOverride,
  type ChatSource,
} from '../../src/components/chat-sources/index.js';
import { Markdown } from '../../src/components/markdown/markdown.js';
import { requireDefined } from './require-defined.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sources: ChatSource[] = [
  {
    id: 'weather',
    title: 'Lisbon weather by month',
    url: 'https://www.example.com/lisbon/weather',
    snippet:
      'Winters are mild and wet, with highs around 15 °C; summers are dry and sunny, and the sea stays cool all year.',
  },
  {
    id: 'rail',
    title: 'Coastal rail timetable',
    url: 'https://example.org/rail/coastal',
    siteName: 'Rail guide',
    snippet: 'Trains leave Lisbon for Porto every hour; the fastest take just under three hours.',
  },
  {
    id: 'notes',
    title: 'Trip notes',
    snippet: 'Pack light layers and comfortable shoes for the hills.',
  },
];

const minimalSources: ChatSource[] = sources.map(({ id, title }) => ({ id, title }));

const answer = [
  'Lisbon is mild in winter and dry in summer [1], so spring and autumn are the easiest months to walk the hills.',
  '',
  '- Trains to Porto leave every hour [2].',
  '- Pack light layers [3] and **comfortable shoes** [1, 3].',
  '',
  'A marker without a source, such as [7], stays text, and so does `list[1]` in code.',
  '',
  'A marker inside a link, as in [the timetable [2]](https://example.com/timetable), stays text, so the link holds no other link.',
  '',
  '- [x] Booked the train [2]',
].join('\n');

function AnswerDemo() {
  const renderNode = useMemo(() => createCitationOverride(sources), []);
  return (
    <div data-lab-demo="answer" style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      <Markdown source={answer} renderNode={renderNode} />
      <ChatSources sources={sources} />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Sources list"
      description="One or several sources, with their full details (link, site, snippet) or only titles."
    >
      <StateMatrix
        axes={{ count: ['one', 'several'], details: ['full', 'minimal'] }}
        render={({ count, details }) => {
          const list = details === 'full' ? sources : minimalSources;
          return (
            <div style={{ width: 320 }}>
              <ChatSources sources={count === 'one' ? list.slice(0, 1) : list} />
            </div>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Citations"
      description="Inline markers preview their source on hover, keyboard focus and long press. A marker links to its source; one without a URL opens its card on press."
    >
      <p data-lab-demo="citations" style={{ maxWidth: 560 }}>
        Winters are mild
        <ChatCitation source={requireDefined(sources[0])} index={1} />, trains run hourly
        <ChatCitation source={requireDefined(sources[1])} index={2} />, and the notes say to pack
        layers
        <ChatCitation source={requireDefined(sources[2])} index={3} />.
      </p>
    </LabSection>
    <LabSection
      title="Answer with citations"
      description="createCitationOverride turns the [n] markers of a Markdown answer into citations of its sources, listed below it. Unknown numbers and code stay text, as do markers inside a link or a task label, where a citation's link or button cannot nest."
    >
      <AnswerDemo />
    </LabSection>
  </>,
);
