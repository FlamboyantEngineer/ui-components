import { useState } from 'react';
import {
  ChatPlan,
  ChatReasoning,
  type ChatReasoningFormat,
  ChatStatusLine,
  ChatSteps,
} from '../../src/components/chat-activity/index.js';
import { Icon } from '../../src/components/icon/icon.js';
import { Switch } from '../../src/components/switch/switch.js';
import { SearchGlyph } from '../../src/core/glyphs.js';
import { LabToolCall, planSteps, reasoningText } from './chat-activity-samples.js';
import { ActivitySimulation } from './chat-activity-simulation.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

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
      <ChatSteps actions={[{ kind: 'search', count: 1 }]}>
        <LabToolCall label="Searched trains to Porto" />
      </ChatSteps>
    );
  }
  return (
    <ChatSteps
      isRunning={isRunning}
      actions={[
        { kind: 'search', count: 1 },
        { kind: 'read', count: 1 },
      ]}
      defaultExpanded={readerChoices[state]}
    >
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

const openings = ['automatically', 'on request'] as const;

/**
 * Reasoning and steps that open while they run, beside ones that wait for the reader
 * (`expandsAutomatically` false), all driven by one switch: the run ends with the switch off, and
 * a part the reader opened or closed keeps that choice.
 */
function ManualExpansion() {
  const [isRunning, setRunning] = useState(true);
  return (
    <div data-lab-demo="manual">
      <Switch isSelected={isRunning} onChange={setRunning}>
        Running
      </Switch>
      <StateMatrix
        axes={{ part: ['reasoning', 'steps'], opens: openings }}
        render={({ part, opens }) => {
          const expandsAutomatically = opens === 'automatically';
          return (
            <div style={{ width: 260 }}>
              {part === 'reasoning' ? (
                <ChatReasoning
                  text={isRunning ? reasoningText.slice(0, 90) : reasoningText}
                  status={isRunning ? 'streaming' : 'complete'}
                  durationMs={4400}
                  expandsAutomatically={expandsAutomatically}
                />
              ) : (
                <ChatSteps
                  isRunning={isRunning}
                  actions={[{ kind: 'search', count: 2 }]}
                  expandsAutomatically={expandsAutomatically}
                >
                  <LabToolCall label="Searched trains to Porto" />
                  <LabToolCall
                    label={isRunning ? 'Searching buses to Porto…' : 'Searched buses to Porto'}
                    isRunning={isRunning}
                  />
                </ChatSteps>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}

/**
 * Steps whose expansion a switch outside controls while the run goes on and ends: the run changes
 * nothing, and each press of the trigger is a request the host applies and reports.
 */
function ControlledSteps() {
  const [isExpanded, setExpanded] = useState(false);
  const [isRunning, setRunning] = useState(true);
  const [requested, setRequested] = useState('none');
  return (
    <div data-lab-demo="controlled-steps">
      <Switch isSelected={isExpanded} onChange={setExpanded}>
        Show the steps
      </Switch>
      <Switch isSelected={isRunning} onChange={setRunning}>
        Still running
      </Switch>
      <ChatSteps
        isRunning={isRunning}
        actions={[{ kind: 'search', count: 1 }]}
        isExpanded={isExpanded}
        onExpandedChange={(next) => {
          setRequested(String(next));
          setExpanded(next);
        }}
      >
        <LabToolCall
          label={isRunning ? 'Searching trains to Porto…' : 'Searched trains to Porto'}
          isRunning={isRunning}
        />
      </ChatSteps>
      <LabOutput name="requested">{requested}</LabOutput>
    </div>
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
      title="Opening on request"
      description="With expandsAutomatically false, running reasoning and steps stay closed until the reader opens them, still busy and labelled as they run; the default opens them. Turn Running off to end the run: the automatic parts collapse, and a part the reader opened or closed keeps that choice."
    >
      <ManualExpansion />
    </LabSection>
    <LabSection
      title="Controlled steps"
      description="The Show the steps switch controls the group (isExpanded); its trigger asks to change it through onExpandedChange, which flips the switch. Ending the run with Still running changes nothing while controlled."
    >
      <ControlledSteps />
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
      description="A live line while the assistant works, its text shimmering: what it does, Thinking… without a text, or an icon in place of the busy indicator. While it writes its answer (activity writing) the indicator shows alone, without text or announcement, even with a text given. Nothing once it stops."
    >
      <StateMatrix
        axes={{
          running: ['running', 'stopped'],
          content: ['text', 'thinking', 'icon', 'writing'],
        }}
        render={({ running, content }) => (
          <ChatStatusLine
            text={
              content === 'text' || content === 'writing' ? 'Searching trains to Porto…' : undefined
            }
            activity={content === 'writing' ? 'writing' : 'thinking'}
            icon={content === 'icon' ? <Icon icon={SearchGlyph} size="sm" /> : undefined}
            isRunning={running === 'running'}
          />
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
