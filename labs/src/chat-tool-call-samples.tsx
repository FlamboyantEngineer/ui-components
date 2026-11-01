import { useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ChatToolCall,
  type ChatToolCallApproval,
  type ChatToolCallStatus,
} from '../../src/components/chat-tool-call/chat-tool-call.js';

/** What a recipe search takes and returns, the matrices' sample call. */
export const recipeArgs = { query: 'lentil soup', servings: 4, diet: ['vegetarian'] };
export const recipeResult = {
  count: 2,
  recipes: [
    { title: 'Red lentil soup', minutes: 35 },
    { title: 'Lentil and lemon soup', minutes: 40 },
  ],
};

const stations = ['Lisbon', 'Coimbra', 'Aveiro', 'Porto'];

/** A timetable long enough to scroll: forty departures of a travel planner's train search. */
export const timetableResult = {
  route: 'Lisbon to Porto',
  date: '2026-05-14',
  departures: Array.from({ length: 40 }, (_, index) => ({
    train: `IC ${510 + index}`,
    departs: `${String(6 + Math.floor(index / 3)).padStart(2, '0')}:${String((index % 3) * 20).padStart(2, '0')}`,
    stops: stations,
    seatsLeft: (index * 7) % 23,
  })),
};

const forecast = [
  { day: 'Tuesday', summary: 'Sunny', high: 24 },
  { day: 'Wednesday', summary: 'Light cloud', high: 22 },
  { day: 'Thursday', summary: 'Showers', high: 19 },
];

/** A weather tool's own view of its result, as a host's custom body. */
export function ForecastCard() {
  return (
    <div data-lab-forecast="porto">
      <p>
        <strong>Porto</strong> · Sunny, 24 °C, light wind from the north
      </p>
      <ul>
        {forecast.map((day) => (
          <li key={day.day}>
            {day.day}: {day.summary}, {day.high} °C
          </li>
        ))}
      </ul>
    </div>
  );
}

interface DemoCall {
  status: ChatToolCallStatus;
  approval: ChatToolCallApproval;
  result?: unknown;
  durationMs?: number;
}

const askingCall: DemoCall = {
  status: 'approval-requested',
  approval: { scopeLabel: 'this conversation' },
};

/**
 * A host that answers each decision as a chat would: approving or always allowing runs the tool,
 * which finishes after a moment, and denying records the reason. The callbacks it received are
 * listed below the card.
 */
export function ApprovalDemo() {
  const [call, setCall] = useState<DemoCall>(askingCall);
  const [events, setEvents] = useState<string[]>([]);
  const timer = useRef<number | null>(null);
  const clearTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clearTimer, []);
  const run = (approval: ChatToolCallApproval, event: string) => {
    setEvents((list) => [...list, event]);
    setCall({ status: 'running', approval });
    timer.current = window.setTimeout(() => {
      setCall({ status: 'succeeded', approval, result: { removed: 12 }, durationMs: 1500 });
    }, 1500);
  };
  const reset = () => {
    clearTimer();
    setCall(askingCall);
    setEvents([]);
  };
  return (
    <div data-lab-demo="approval">
      <ChatToolCall
        id="demo-call"
        name="delete_drafts"
        label="Delete old drafts"
        args={{ folder: 'drafts', olderThanDays: 30 }}
        {...call}
        onApprove={() => run({ decision: 'approved' }, 'onApprove()')}
        onAlwaysAllow={() =>
          run({ decision: 'always', scopeLabel: 'this conversation' }, 'onAlwaysAllow()')
        }
        onDeny={(reason) => {
          setEvents((list) => [...list, `onDeny(${reason === undefined ? '' : `"${reason}"`})`]);
          setCall({ status: 'denied', approval: { decision: 'denied', reason } });
        }}
      />
      <p>
        <Button size="sm" onPress={reset}>
          Ask again
        </Button>
      </p>
      <ol aria-label="Callbacks" data-lab-events="approval">
        {events.map((event, index) => (
          <li key={index}>{event}</li>
        ))}
      </ol>
    </div>
  );
}

/** The calls the queue demo asks about in turn, each a separate call with its own id. */
const queuedCalls = [
  { id: 'queued-read', name: 'read_file', args: { path: 'notes/today.md' } },
  { id: 'queued-delete', name: 'delete_file', args: { path: 'notes/old.md' } },
] as const;

/**
 * One card that a host reuses for its next waiting call: Next call shows the other call in place,
 * with a fresh approval, even while a reason is being typed for the first. The callbacks list which
 * call each decision reached.
 */
export function QueueDemo() {
  const [index, setIndex] = useState(0);
  const [events, setEvents] = useState<string[]>([]);
  const call = queuedCalls[index % queuedCalls.length] ?? queuedCalls[0];
  const record = (event: string) => setEvents((list) => [...list, `${call.id}: ${event}`]);
  return (
    <div data-lab-demo="queue">
      <ChatToolCall
        id={call.id}
        name={call.name}
        args={call.args}
        status="approval-requested"
        onApprove={() => record('onApprove()')}
        onDeny={(reason) => record(`onDeny(${reason === undefined ? '' : `"${reason}"`})`)}
      />
      <p>
        <Button size="sm" onPress={() => setIndex((value) => value + 1)}>
          Next call
        </Button>
      </p>
      <ol aria-label="Queue callbacks" data-lab-events="queue">
        {events.map((event, position) => (
          <li key={position}>{event}</li>
        ))}
      </ol>
    </div>
  );
}
