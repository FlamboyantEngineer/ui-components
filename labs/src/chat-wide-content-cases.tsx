// The Chat lab's wide content: long prose, words, links, inline code, code blocks and tables that
// stay within a narrow chat, and code highlighted by its fence language.

import { useState } from 'react';
import { Chat, type ChatMessageData, useChatController } from '../../src/components/chat/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Stack } from '../../src/components/layout/layout.js';
import { agents } from './chat-agent.js';
import { assistantPeople, plannerId, readerId, textMessage } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

const promptLines = [
  'Plan a three-day walking trip along the coast for two people who like quiet villages, good coffee and short ferry crossings between the islands.',
  '',
  '1. Daily routes',
  'Keep each day under fifteen kilometres, start every route at a railway station or a ferry pier, and list the cafes and bakeries along the way with their opening hours.',
  '',
  '2. Rainy-day plans',
  'For each day, suggest an indoor alternative within one stop of the route: a museum, a covered market or a library reading room that welcomes visitors.',
];

const reply = [
  'Here is the prompt, as plain text:',
  '',
  '```text',
  ...promptLines,
  '```',
  '',
  'And the script that checks each route against the timetable:',
  '',
  '```ts',
  'export async function checkRoute(route: Route, timetable: Timetable): Promise<RouteCheck> {',
  '  const departures = timetable.departuresFrom(route.start).filter((departure) => departure.time >= route.earliestStart && departure.time <= route.latestStart); // keep the morning window',
  '  return { route: route.id, departures, isWalkable: route.lengthKm <= 15 };',
  '}',
  '```',
  '',
  'It reads `timetable.departuresFromStationOrPierWithinTheMorningWindowAndWithoutChanges()` and stores its results under https://example.com/trips/coast/three-days/routes/checked/2026-04-20/summary-with-every-departure.json.',
  '',
  '| Day | Start | Finish | Length | Ferry | Cafes | Indoor alternative |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  '| Friday | Harbour station | North pier | 12 km | 09:40 | Three on the quay | Maritime museum |',
  '| Saturday | North pier | Lighthouse village | 14 km | 10:15 | Two in the square | Covered market |',
  '| Sunday | Lighthouse village | Harbour station | 11 km | 08:55 | One bakery | Library reading room |',
].join('\n');

const initialMessages: ChatMessageData[] = [
  textMessage({
    id: 'wide-1',
    authorId: readerId,
    time: '2026-04-20T10:00:00',
    text: 'Write the trip prompt and a script to check it. The draft is in drafts/coast-trip-three-days-quiet-villages-good-coffee-short-ferries-final-final.md',
  }),
  textMessage({ id: 'wide-2', authorId: plannerId, time: '2026-04-20T10:01:00', text: reply }),
  {
    id: 'wide-3',
    authorId: plannerId,
    createdAt: '2026-04-20T10:01:30',
    parts: [
      {
        type: 'code',
        id: 'wide-3-code',
        language: 'py',
        title: 'check_routes.py',
        code: [
          'def check(routes, limit_km=15):',
          '    """Keep the routes short enough to walk in a day, with a ferry in the morning window."""',
          '    return [route for route in routes if route.length_km <= limit_km and route.ferry_departs_between("08:30", "10:30")]',
        ].join('\n'),
      },
    ],
  },
];

/** A narrow trip planner whose replies hold content wider than the chat. */
function WideContentDemo() {
  const controller = useChatController({
    send: agents.answer,
    currentUserId: readerId,
    assistantId: plannerId,
    initialMessages,
  });
  const [receivedBubble, setReceivedBubble] = useState(false);
  return (
    <Stack space="sm" data-lab-demo="wide-content">
      <Checkbox isSelected={receivedBubble} onChange={setReceivedBubble}>
        Background on replies
      </Checkbox>
      <div style={{ height: 1250, maxWidth: 520 }}>
        <Chat
          {...controller.props}
          aria-label="Conversation with wide content"
          participants={assistantPeople}
          currentUserId={readerId}
          placeholder="Ask the trip planner…"
          receivedVariant={receivedBubble ? 'bubble' : 'plain'}
          scrollMode="follow"
        />
      </div>
    </Stack>
  );
}

export function ChatWideContentCases() {
  return (
    <LabSection
      title="Wide content"
      description="Content wider than the chat stays inside it. Prose, a long file name, a long link and long inline code wrap; a text fence holds prose, so it wraps too; code keeps its lines and scrolls sideways inside its own frame (focusable while it overflows, so the arrow keys scroll it); a wide table scrolls sideways in its frame, its cells breaking between words. Fenced code and code parts are highlighted by their language (ts, py and the other Code Editor presets and their short names)."
    >
      <WideContentDemo />
    </LabSection>
  );
}
