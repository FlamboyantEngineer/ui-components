import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ChatSources,
  createCitationOverride,
  type ChatSource,
} from '../../src/components/chat-sources/index.js';
import { createCodeBlockOverride } from '../../src/components/code-block/index.js';
import { Markdown, type MarkdownNode } from '../../src/components/markdown/index.js';

const sources: ChatSource[] = [
  {
    id: 'weather',
    title: 'Lisbon weather by month',
    url: 'https://www.example.com/lisbon/weather',
    snippet: 'Spring and autumn are mild; summers are dry and sunny.',
  },
  {
    id: 'rail',
    title: 'Coastal rail timetable',
    url: 'https://example.org/rail/coastal',
    siteName: 'Rail guide',
    snippet: 'Trains leave Lisbon for Porto every hour.',
  },
];

const answer = [
  '## Five days in Lisbon and Porto',
  '',
  'Spend **three days in Lisbon** and two in Porto; the train between them takes about *three hours* [2]. See the [rail timetable](https://example.org/rail/coastal) for times.',
  '',
  '### Plan',
  '',
  '1. Walk the Alfama hills and ride tram 28.',
  '2. Take a day trip to Sintra for the **palaces**.',
  '3. Catch the morning train to Porto.',
  '',
  '| Day | City | Highlights |',
  '| --- | --- | --- |',
  '| 1 | Lisbon | Alfama, tram 28 |',
  '| 2 | Lisbon | Riverside walk |',
  '| 3 | Sintra | Pena Palace |',
  '| 4 | Porto | Ribeira, bridges |',
  '| 5 | Porto | Bookshops, cafés |',
  '',
  'Add the plan to your notes with the helper:',
  '',
  '```ts',
  'const days = countDays(plan.stops);',
  '```',
  '',
  'Then check the route:',
  '',
  '```console',
  '$ npx trip-kit plan --from Lisbon --to Porto',
  'Route ready: 3 h 10 min',
  '```',
  '',
  '> Spring and autumn are mild [1], so pack _light layers_ and comfortable shoes.',
].join('\n');

/** The answer split into chunks of a few characters, as a model streams tokens. */
const chunks = answer.match(/[\s\S]{1,6}/g) ?? [];

/** Streams a long answer chunk by chunk through a streaming `Markdown`, counting rendered nodes. */
export function StreamingDemo() {
  const [count, setCount] = useState(chunks.length);
  const [isRunning, setRunning] = useState(false);
  const calls = useRef(0);
  // The chunk and the nodes it rendered change together, so a reading never pairs one chunk with another's count.
  const [sample, setSample] = useState({ chunk: chunks.length, rendered: 0 });
  const renderNode = useMemo(() => {
    const codeOverride = createCodeBlockOverride();
    const citationOverride = createCitationOverride(sources);
    return (node: MarkdownNode) => {
      calls.current += 1;
      return codeOverride(node) ?? citationOverride(node);
    };
  }, []);
  const isDone = count >= chunks.length;
  useEffect(() => {
    if (!isRunning || isDone) return undefined;
    const timer = window.setInterval(() => setCount((current) => current + 1), 40);
    return () => window.clearInterval(timer);
  }, [isRunning, isDone]);
  const previousCalls = useRef(0);
  useEffect(() => {
    setSample({ chunk: count, rendered: calls.current - previousCalls.current });
    previousCalls.current = calls.current;
  }, [count]);
  const isStreaming = isRunning && !isDone;
  return (
    <div data-lab-demo="streaming" style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button
          onPress={() => {
            setCount(0);
            setRunning(true);
          }}
        >
          Stream the answer
        </Button>
        <span data-lab-output="progress">
          Chunk {sample.chunk} of {chunks.length} · {sample.rendered} nodes rendered for the last
          chunk
        </span>
      </div>
      <Markdown
        source={chunks.slice(0, count).join('')}
        isStreaming={isStreaming}
        renderNode={renderNode}
        data-lab-stream
      />
      {isDone ? <ChatSources sources={sources} /> : null}
    </div>
  );
}
