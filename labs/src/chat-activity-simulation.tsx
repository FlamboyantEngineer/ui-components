// A reply that streams in: reasoning, then tool calls, inside one group of steps, while the plan
// advances and the status line says what the assistant is doing; then the collapsed summaries.

import { useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import type {
  ChatPlanStep,
  ChatPlanStepStatus,
} from '../../src/components/chat-activity/chat-activity.js';
import {
  ChatPlan,
  ChatReasoning,
  ChatStatusLine,
  ChatSteps,
} from '../../src/components/chat-activity/index.js';
import { ChatMessage } from '../../src/components/chat-transcript/chat-transcript.js';
import { Stack } from '../../src/components/layout/layout.js';
import { Markdown } from '../../src/components/markdown/markdown.js';
import { LabToolCall, reasoningText } from './chat-activity-samples.js';

/** One tick of the simulation, in milliseconds. */
const tick = 400;

const reasoningWords = reasoningText.split(' ');

/** The tick the reasoning completes on; each tick streams five more words. */
const reasoningEnd = Math.ceil(reasoningWords.length / 5);

/** The tool calls, each running for three ticks after the one before. */
const tools = [
  { running: 'Searching trains to Porto', done: 'Searched trains to Porto' },
  { running: 'Reading the timetable', done: 'Read the timetable' },
  { running: 'Comparing the fares', done: 'Compared the fares' },
];

const toolStart = (index: number) => reasoningEnd + index * 3;

/** The tick the run ends on, after the last tool and a tick of writing. */
const runEnd = toolStart(tools.length) + 2;

const planLabels = [
  'Find trains to Porto',
  'Check the timetable',
  'Compare the fares',
  'Suggest a departure',
];

const answer =
  'Take the **8:05** from Lisbon: it arrives at 10:50 and is the cheapest fare that morning.';

function planStatus(index: number, now: number): ChatPlanStepStatus {
  const start = index < tools.length ? toolStart(index) : toolStart(tools.length);
  const end = index < tools.length ? toolStart(index + 1) : runEnd;
  if (now >= end) return 'done';
  return now >= start ? 'in-progress' : 'pending';
}

function statusText(now: number): string {
  if (now < reasoningEnd) return 'Thinking about the trip…';
  const index = Math.floor((now - reasoningEnd) / 3);
  const tool = tools[index];
  return tool ? `${tool.running}…` : 'Writing the answer…';
}

/** The reply's parts at a tick of the simulation. */
function ReplyAt({ now }: { now: number }) {
  const isRunning = now < runEnd;
  const plan: ChatPlanStep[] = planLabels.map((label, index) => ({
    id: label,
    label,
    status: planStatus(index, now),
  }));
  const startedTools = tools.filter((_, index) => now >= toolStart(index));
  return (
    <Stack space="sm">
      <ChatPlan title="Saturday in Porto" steps={plan} data-lab-sim="plan" />
      <ChatSteps
        isRunning={isRunning}
        durationMs={runEnd * tick}
        stepCount={1 + startedTools.length}
        data-lab-sim="steps"
      >
        <ChatReasoning
          text={reasoningWords.slice(0, now * 5 + 5).join(' ')}
          status={now < reasoningEnd ? 'streaming' : 'complete'}
          durationMs={reasoningEnd * tick}
          data-lab-sim="reasoning"
        />
        {startedTools.map((tool, index) => (
          <LabToolCall
            key={tool.done}
            label={now < toolStart(index + 1) ? `${tool.running}…` : tool.done}
            isRunning={now < toolStart(index + 1)}
          />
        ))}
      </ChatSteps>
      <ChatStatusLine text={statusText(now)} isRunning={isRunning} data-lab-sim="status" />
      {isRunning ? null : <Markdown source={answer} />}
    </Stack>
  );
}

/** Runs the reply from the start each time Run is pressed. */
export function ActivitySimulation() {
  const [run, setRun] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  const isRunning = now !== null && now < runEnd;
  const start = () => {
    setRun((value) => value + 1);
    setNow(0);
  };
  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = window.setTimeout(() => setNow((value) => (value ?? 0) + 1), tick);
    return () => window.clearTimeout(timer);
  }, [isRunning, now]);
  return (
    <>
      <Button onPress={start} data-lab-sim="run">
        {now === null ? 'Run the reply' : 'Run it again'}
      </Button>
      {now === null ? null : (
        <ChatMessage
          origin="received"
          author={{ name: 'Trip planner', colorKey: 'planner' }}
          status={isRunning ? 'streaming' : 'complete'}
          data-lab-sim="message"
        >
          {/* Each run starts over, forgetting what the reader opened or closed in the last one. */}
          <ReplyAt key={run} now={now} />
        </ChatMessage>
      )}
    </>
  );
}
