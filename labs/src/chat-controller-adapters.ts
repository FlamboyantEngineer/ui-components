// Examples, not exports: map an AG-UI-style event stream and an AI SDK-style UI message stream
// onto the controller's events in a few lines each.

import type {
  ChatSendFunction,
  ChatStreamEvent,
} from '../../src/components/chat-controller/chat-controller.js';

/** The AG-UI-style events the example maps (a subset of that protocol). */
export type AgUiEvent =
  | { type: 'RUN_STARTED' | 'RUN_FINISHED' | 'TEXT_MESSAGE_START' | 'TEXT_MESSAGE_END' }
  | { type: 'TEXT_MESSAGE_CONTENT'; delta: string }
  | { type: 'THINKING_START' | 'THINKING_END' }
  | { type: 'THINKING_TEXT_MESSAGE_CONTENT'; delta: string }
  | { type: 'TOOL_CALL_START'; toolCallId: string; toolCallName: string }
  | { type: 'TOOL_CALL_ARGS'; toolCallId: string; delta: string }
  | { type: 'TOOL_CALL_END'; toolCallId: string }
  | { type: 'TOOL_CALL_RESULT'; toolCallId: string; content: string }
  | { type: 'STEP_STARTED'; stepName: string }
  | { type: 'STEP_FINISHED'; stepName: string }
  | { type: 'RUN_ERROR'; message: string };

/** What the mapping remembers: each tool call's name and streamed arguments, and the thinking. */
interface AgUiState {
  calls: Map<string, { name: string; args: string }>;
  thinking: number;
}
type AgUiMappers = {
  [T in AgUiEvent['type']]?: (
    event: Extract<AgUiEvent, { type: T }>,
    state: AgUiState,
  ) => ChatStreamEvent | undefined;
};

/** How each AG-UI-style event maps; a tool call's streamed arguments gather until it ends. */
const agUiMappers: AgUiMappers = {
  TEXT_MESSAGE_CONTENT: ({ delta }) => ({ type: 'text-delta', text: delta }),
  THINKING_START: (_event, state) => {
    state.thinking += 1;
    return undefined;
  },
  THINKING_TEXT_MESSAGE_CONTENT: ({ delta }, { thinking }) => ({
    type: 'reasoning-delta',
    id: `thinking-${thinking}`,
    text: delta,
  }),
  THINKING_END: (_event, { thinking }) => ({ type: 'reasoning-end', id: `thinking-${thinking}` }),
  TOOL_CALL_START: ({ toolCallId, toolCallName }, { calls }) => {
    calls.set(toolCallId, { name: toolCallName, args: '' });
    return { type: 'tool-call', id: toolCallId, name: toolCallName };
  },
  TOOL_CALL_ARGS: ({ toolCallId, delta }, { calls }) => {
    const call = calls.get(toolCallId);
    if (call) call.args += delta;
    return undefined;
  },
  TOOL_CALL_END: ({ toolCallId }, { calls }) => {
    const call = calls.get(toolCallId);
    return (
      call && { type: 'tool-call', id: toolCallId, name: call.name, args: JSON.parse(call.args) }
    );
  },
  TOOL_CALL_RESULT: ({ toolCallId, content }) => ({
    type: 'tool-result',
    id: toolCallId,
    result: content,
  }),
  STEP_STARTED: ({ stepName }) => ({ type: 'status', text: stepName }),
  STEP_FINISHED: () => ({ type: 'status', text: '' }),
  RUN_ERROR: ({ message }) => ({ type: 'error', message }),
  RUN_FINISHED: () => ({ type: 'finish' }),
};

/** Maps an AG-UI-style stream. */
export async function* fromAgUi(events: AsyncIterable<AgUiEvent>): AsyncGenerator<ChatStreamEvent> {
  const state: AgUiState = { calls: new Map(), thinking: 0 };
  for await (const event of events) {
    const map = agUiMappers[event.type] as
      | ((event: AgUiEvent, state: AgUiState) => ChatStreamEvent | undefined)
      | undefined;
    const mapped = map?.(event, state);
    if (mapped) yield mapped;
  }
}

/** The AI SDK-style UI message stream chunks the example maps (a subset of that protocol). */
export type UiMessageChunk =
  | { type: 'start' | 'start-step' | 'finish-step' | 'finish' }
  | { type: 'text-start' | 'text-end' | 'reasoning-start'; id: string }
  | { type: 'text-delta' | 'reasoning-delta'; id: string; delta: string }
  | { type: 'reasoning-end'; id: string }
  | { type: 'tool-input-available'; toolCallId: string; toolName: string; input: unknown }
  | { type: 'tool-output-available'; toolCallId: string; output: unknown }
  | { type: 'tool-output-error'; toolCallId: string; errorText: string }
  | { type: 'tool-approval-request'; approvalId: string; toolCallId: string }
  | { type: 'source-url'; sourceId: string; url: string; title?: string }
  | { type: 'error'; errorText: string };

/** Maps one AI SDK-style chunk; chunks without a counterpart map to nothing. */
export function fromUiMessageChunk(chunk: UiMessageChunk): ChatStreamEvent | undefined {
  switch (chunk.type) {
    case 'text-delta':
      return { type: 'text-delta', text: chunk.delta };
    case 'reasoning-delta':
      return { type: 'reasoning-delta', id: chunk.id, text: chunk.delta };
    case 'reasoning-end':
      return { type: 'reasoning-end', id: chunk.id };
    case 'tool-input-available':
      return { type: 'tool-call', id: chunk.toolCallId, name: chunk.toolName, args: chunk.input };
    case 'tool-output-available':
      return { type: 'tool-result', id: chunk.toolCallId, result: chunk.output };
    case 'tool-output-error':
      return { type: 'tool-result', id: chunk.toolCallId, error: chunk.errorText };
    case 'tool-approval-request':
      return { type: 'approval-request', id: chunk.toolCallId };
    case 'source-url':
      return {
        type: 'source',
        source: { id: chunk.sourceId, title: chunk.title ?? chunk.url, url: chunk.url },
      };
    case 'error':
      return { type: 'error', message: chunk.errorText };
    case 'finish':
      return { type: 'finish' };
    default:
      return undefined;
  }
}

/** Maps an AI SDK-style UI message stream. */
export async function* fromUiMessageStream(
  chunks: AsyncIterable<UiMessageChunk>,
): AsyncGenerator<ChatStreamEvent> {
  for await (const chunk of chunks) {
    const event = fromUiMessageChunk(chunk);
    if (event) yield event;
  }
}

/** Emits `items` one after another, `pause` milliseconds apart, until the signal aborts. */
async function* paced<T>(items: readonly T[], signal: AbortSignal, pause = 120) {
  for (const item of items) {
    await new Promise((resolve) => setTimeout(resolve, pause));
    if (signal.aborted) return;
    yield item;
  }
}

const words = (text: string) => text.split(/(?<= )/);

/** A fake AG-UI-style agent run that looks up the weather and answers. */
export const agUiSend: ChatSendFunction = (_messages, { signal }) =>
  fromAgUi(
    paced<AgUiEvent>(
      [
        { type: 'RUN_STARTED' },
        { type: 'STEP_STARTED', stepName: 'Checking the weather…' },
        { type: 'TOOL_CALL_START', toolCallId: 'ag-weather', toolCallName: 'get_weather' },
        { type: 'TOOL_CALL_ARGS', toolCallId: 'ag-weather', delta: '{"city":' },
        { type: 'TOOL_CALL_ARGS', toolCallId: 'ag-weather', delta: '"Porto"}' },
        { type: 'TOOL_CALL_END', toolCallId: 'ag-weather' },
        { type: 'TOOL_CALL_RESULT', toolCallId: 'ag-weather', content: 'Sunny, 24 °C' },
        { type: 'STEP_FINISHED', stepName: 'Checking the weather…' },
        { type: 'TEXT_MESSAGE_START' },
        ...words('It is sunny in Porto: a good day for a picnic.').map(
          (delta) => ({ type: 'TEXT_MESSAGE_CONTENT', delta }) as const,
        ),
        { type: 'TEXT_MESSAGE_END' },
        { type: 'RUN_FINISHED' },
      ],
      signal,
    ),
  );

/** A fake AI SDK-style UI message stream that reasons, cites a source and answers. */
export const aiSdkSend: ChatSendFunction = (_messages, { signal }) =>
  fromUiMessageStream(
    paced<UiMessageChunk>(
      [
        { type: 'start' },
        { type: 'reasoning-start', id: 'sdk-r' },
        { type: 'reasoning-delta', id: 'sdk-r', delta: 'Trains or buses?' },
        { type: 'reasoning-end', id: 'sdk-r' },
        {
          type: 'source-url',
          sourceId: 'timetable',
          url: 'https://example.com/trains',
          title: 'Timetable',
        },
        { type: 'text-start', id: 'sdk-t' },
        ...words('The 8:05 train is the fastest way to Porto [1].').map(
          (delta) => ({ type: 'text-delta', id: 'sdk-t', delta }) as const,
        ),
        { type: 'text-end', id: 'sdk-t' },
        { type: 'finish' },
      ],
      signal,
    ),
  );
