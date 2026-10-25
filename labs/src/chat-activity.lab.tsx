import { useState } from 'react';
import {
  ChatPlan,
  ChatReasoning,
  ChatStatusLine,
  ChatSteps,
  type ChatReasoningFormat,
} from '../../src/components/chat-activity/index.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabToolCall, planSteps, reasoningText } from './chat-activity-samples.js';
import { ActivitySimulation } from './chat-activity-simulation.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const formats = ['markdown', 'plain'] as const satisfies readonly ChatReasoningFormat[];
const reasoningStates = [
  'streaming',
  'complete',
  'no-duration',
  'reader-opened',
  'reader-closed',
] as const;
const stepsStates = ['running', 'reader-closed', 'finished', 'reader-opened', 'one-step'] as const;

/** The reader's choice each state starts from, standing in for a press (`defaultExpanded`). */
const readerChoices: Partial<Record<string, boolean>> = {
  'reader-opened': true,
  'reader-closed': false,
};

const reasoningDurations: Partial<Record<(typeof reasoningStates)[number], number>> = {
  complete: 4400,
  'reader-opened': 65_000,
};

function ReasoningCell({
  format,
  state,
}: {
  format: ChatReasoningFormat;
  state: (typeof reasoningStates)[number];
}) {
  const isStreaming = state === 'streaming' || state === 'reader-closed';
  return (
    <ChatReasoning
      text={isStreaming ? reasoningText.slice(0, 90) : reasoningText}
      status={isStreaming ? 'streaming' : 'complete'}
      durationMs={reasoningDurations[state]}
      format={format}
      defaultExpanded={readerChoices[state]}
    />
  );
}

function StepsCell({ state }: { state: (typeof stepsStates)[number] }) {
  const isRunning = state === 'running' || state === 'reader-closed';
  if (state === 'one-step') {
    return (
      <ChatSteps stepCount={1}>
        <LabToolCall label="Searched trains to Porto" />
      </ChatSteps>
    );
  }
  return (
    <ChatSteps isRunning={isRunning} durationMs={12_300} defaultExpanded={readerChoices[state]}>
      <ChatReasoning text={reasoningText} status="complete" durationMs={2000} />
      <LabToolCall label="Searched trains to Porto" />
      <LabToolCall
        label={isRunning ? 'Reading the timetable…' : 'Read the timetable'}
        isRunning={isRunning}
      />
    </ChatSteps>
  );
}

/** Reasoning whose expansion a switch outside controls, and which reports the reader's presses. */
function ControlledReasoning() {
  const [isExpanded, setExpanded] = useState(false);
  return (
    <>
      <Switch isSelected={isExpanded} onChange={setExpanded}>
        Show the reasoning
      </Switch>
      <ChatReasoning
        text={reasoningText}
        status="complete"
        durationMs={4400}
        isExpanded={isExpanded}
        onExpandedChange={setExpanded}
        data-lab-demo="controlled"
      />
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Reasoning"
      description="Streaming reasoning is open and busy, labelled Thinking…; complete reasoning collapses to how long it took, or a moment without a duration. The reader's choice (defaultExpanded here) wins over the status. Markdown is the default format; plain shows the text as written."
    >
      <StateMatrix
        axes={{ format: formats, state: reasoningStates }}
        render={({ format, state }) => (
          <div style={{ width: 260 }}>
            <ReasoningCell format={format} state={state} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Controlled reasoning"
      description="The switch controls the reasoning; pressing its trigger asks to change it, which flips the switch."
    >
      <ControlledReasoning />
    </LabSection>
    <LabSection
      title="Steps"
      description="A group of reasoning and tool calls (stand-ins here) is open while the run goes on and collapses when it ends, counting its steps. The reader's choice wins over the run."
    >
      <StateMatrix
        axes={{ state: stepsStates }}
        render={({ state }) => (
          <div style={{ width: 260 }}>
            <StepsCell state={state} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Plan"
      description="Steps pending, in progress, done, failed and skipped, with the progress, under a title or named Plan."
    >
      <StateMatrix
        axes={{ title: ['titled', 'untitled'] }}
        render={({ title }) => (
          <ChatPlan
            title={title === 'titled' ? 'Saturday in Porto' : undefined}
            steps={planSteps}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Status line"
      description="A live line while the assistant works; nothing once it stops."
    >
      <StateMatrix
        axes={{ running: ['running', 'stopped'] }}
        render={({ running }) => (
          <ChatStatusLine text="Searching trains to Porto…" isRunning={running === 'running'} />
        )}
      />
    </LabSection>
    <LabSection
      title="Streaming reply"
      description="Run the reply: the plan advances, the reasoning streams inside the group of steps, the tool calls run and the status line follows them. When the run ends, the group collapses to its summary and the answer shows."
    >
      <ActivitySimulation />
    </LabSection>
  </>,
);
