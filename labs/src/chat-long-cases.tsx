// The Chat lab's long conversation: a thousand messages full of tool calls, reasoning, code and
// images, of which the chat mounts only the ones near the view.

import { useEffect, useRef, useState } from 'react';
import { Chat } from '../../src/components/chat/index.js';
import type { ChatAttachmentData } from '../../src/components/chat-attachment/chat-attachment.js';
import { useChatController } from '../../src/components/chat-controller/index.js';
import type { ChatMessageData, ChatPart } from '../../src/components/chat-parts/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import { Stack } from '../../src/components/layout/layout.js';
import { agents } from './chat-agent.js';
import { assistantPeople, plannerId, readerId } from './chat-samples.js';
import { LabSection } from './chrome/index.js';

const messageCount = 1000;
const firstMinute = Date.parse('2026-04-01T08:00:00Z');

const questions = [
  'Could you plan a **weekend** by the sea? We like walking and good coffee.',
  'Sounds good. What about rain?',
  'Is there a market on Sunday?',
];

const answers = [
  'Here is a plan:\n\n1. Arrive on Friday evening and walk the harbour.\n2. Saturday: the coast path, about 12 km, with a stop at the lighthouse café.\n3. Sunday: the market, then the train home.',
  'If it rains, swap the coast path for the maritime museum and the covered market. Both are a short walk from the harbour.',
  'Yes, the market hall opens at eight on Sunday, and the bakery beside it an hour earlier.',
];

const tools = [
  { name: 'read_file', kind: 'read' },
  { name: 'edit_file', kind: 'edit' },
  { name: 'run_command', kind: 'command' },
  { name: 'search_places', kind: 'search' },
  { name: 'fetch_page', kind: 'fetch' },
] as const;

/** A drawn picture in the given hue, as an SVG data URL. */
function picture(hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="hsl(${hue} 60% 70%)"/><circle cx="320" cy="200" r="120" fill="hsl(${(hue + 90) % 360} 70% 40%)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function pictures(index: number, count: number): ChatPart {
  const attachments: ChatAttachmentData[] = Array.from({ length: count }, (_, at) => ({
    id: `long-${index}-picture-${at}`,
    name: `photo-${index}-${at}.svg`,
    mediaType: 'image/svg+xml',
    size: 48_000,
    url: picture((index * 13 + at * 47) % 360),
  }));
  return { type: 'files', attachments };
}

/** Three to six tool calls, one in eleven of them failed. */
function toolCalls(index: number): ChatPart[] {
  return Array.from({ length: 3 + (index % 4) }, (_, at): ChatPart => {
    const tool = tools[(index + at) % tools.length] ?? tools[0];
    const hasFailed = (index + at) % 11 === 0;
    return {
      type: 'tool-call',
      id: `long-${index}-call-${at}`,
      name: tool.name,
      kind: tool.kind,
      target: `notes/day-${(index + at) % 9}.md`,
      status: hasFailed ? 'failed' : 'succeeded',
      error: hasFailed ? 'The page did not answer.' : undefined,
      durationMs: 300 + ((index * 37 + at * 91) % 4000),
      args: { query: 'harbour café', day: (index + at) % 9, filters: ['open late', 'quiet'] },
      result: { count: 2, places: ['Lighthouse café', 'Market hall'] },
    };
  });
}

/** The planner's reply: reasoning, tool calls, the answer, and now and then a map or an itinerary. */
function replyParts(index: number): ChatPart[] {
  const parts: ChatPart[] = [
    {
      type: 'reasoning',
      id: `long-${index}-reasoning`,
      text: 'A quiet weekend: look for cafés that open late and a walk that fits a day.',
      status: 'complete',
      durationMs: 4200,
    },
    ...toolCalls(index),
    { type: 'text', text: answers[index % answers.length] ?? '' },
  ];
  if (index % 4 === 1) parts.push(pictures(index, 1));
  if (index % 8 === 3) {
    parts.push({
      type: 'code',
      language: 'json',
      code: '{\n  "day": "Saturday",\n  "walk": "12 km"\n}',
    });
  }
  return parts;
}

function longMessage(index: number): ChatMessageData {
  const isQuestion = index % 2 === 0;
  const question: ChatPart[] = [{ type: 'text', text: questions[index % questions.length] ?? '' }];
  if (index % 6 === 0) question.push(pictures(index, 2));
  return {
    id: `long-${index + 1}`,
    authorId: isQuestion ? readerId : plannerId,
    createdAt: new Date(firstMinute + index * 600_000).toISOString(),
    parts: isQuestion ? question : replyParts(index),
  };
}

const longMessages = Array.from({ length: messageCount }, (_, index) => longMessage(index));

/** How many messages are in the page, counted as the chat mounts and unmounts them. */
function useMountedCount() {
  const frame = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(0);
  useEffect(() => {
    const element = frame.current;
    if (!element) return undefined;
    const count = () => setMounted(element.querySelectorAll('article').length);
    const observer = new MutationObserver(count);
    observer.observe(element, { childList: true, subtree: true });
    count();
    return () => observer.disconnect();
  }, []);
  return { frame, mounted };
}

/** A long working session with the trip planner, with its time in a tooltip over each message. */
function LongDemo() {
  const controller = useChatController({
    send: agents.answer,
    currentUserId: readerId,
    assistantId: plannerId,
    initialMessages: longMessages,
  });
  const [isWhole, setWhole] = useState(false);
  const { frame, mounted } = useMountedCount();
  return (
    <Stack space="sm" data-lab-demo="working-session">
      <Checkbox isSelected={isWhole} onChange={setWhole}>
        Keep every message mounted
      </Checkbox>
      <div ref={frame} style={{ height: 520, maxWidth: 720 }}>
        <Chat
          {...controller.props}
          aria-label="Long conversation with the trip planner"
          participants={assistantPeople}
          currentUserId={readerId}
          placeholder="Ask the trip planner…"
          timePlacement="tooltip"
          showSearch
          title="Trip planner"
          virtualized={isWhole ? false : undefined}
          onCopy={() => undefined}
        />
      </div>
      <p data-lab-mounted="working-session">
        {mounted} of {controller.props.messages.length} messages mounted
      </p>
    </Stack>
  );
}

export function ChatLongCases() {
  return (
    <LabSection
      title="Long conversation"
      description="A thousand messages with tool calls, reasoning, code and images. The chat mounts only the messages near the view, so it opens, scrolls and shows a message's time on hover as quickly as a short one; the count under it follows as you scroll. The header's search finds text anywhere in the history. Keeping every message mounted puts the whole history in the page, for the browser's own find, and takes several seconds."
    >
      <LongDemo />
    </LabSection>
  );
}
