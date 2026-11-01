import {
  ChatToolCall,
  type ChatToolCallApproval,
  type ChatToolCallStatus,
  type ChatToolCallVariant,
} from '../../src/components/chat-tool-call/chat-tool-call.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import {
  ApprovalDemo,
  ForecastCard,
  QueueDemo,
  recipeArgs,
  recipeResult,
  timetableResult,
} from './chat-tool-call-samples.js';

const statuses = [
  'pending',
  'running',
  'approval-requested',
  'succeeded',
  'failed',
  'denied',
  'cancelled',
] as const satisfies readonly ChatToolCallStatus[];

const durations: Partial<Record<ChatToolCallStatus, number>> = {
  succeeded: 1200,
  failed: 3400,
  cancelled: 800,
};

const optionSets = [
  'approve',
  'deny',
  'always',
  'approve deny',
  'approve always',
  'deny always',
  'approve deny always',
] as const;

const decisions = {
  approved: [{ decision: 'approved' }, 'succeeded'],
  denied: [{ decision: 'denied' }, 'denied'],
  'denied with reason': [{ decision: 'denied', reason: 'Search my saved recipes only' }, 'denied'],
  always: [{ decision: 'always', scopeLabel: 'this conversation' }, 'succeeded'],
} as const satisfies Record<string, readonly [ChatToolCallApproval, ChatToolCallStatus]>;

const noop = () => {};

/** A recipe search in one status, with or without its JSON, open or closed at first. */
function StatusCall({
  status,
  details,
  expansion,
}: {
  status: ChatToolCallStatus;
  details: string;
  expansion: string;
}) {
  const withDetails = details === 'args and result';
  return (
    <ChatToolCall
      id={`status-${status}-${details}-${expansion}`.replaceAll(' ', '-')}
      name="search_recipes"
      status={status}
      args={withDetails ? recipeArgs : undefined}
      result={withDetails && status === 'succeeded' ? recipeResult : undefined}
      error={status === 'failed' ? 'The recipe service did not answer in time.' : undefined}
      durationMs={durations[status]}
      approval={status === 'approval-requested' ? { scopeLabel: 'this conversation' } : undefined}
      onApprove={noop}
      onDeny={noop}
      onAlwaysAllow={noop}
      defaultExpanded={expansion === 'expanded'}
    />
  );
}

/** A finished or running call drawn as a card or as a quiet row. */
function VariantCall({ variant, status }: { variant: string; status: string }) {
  const callStatus = status as ChatToolCallStatus;
  return (
    <ChatToolCall
      id={`variant-${variant}-${status}`}
      name="read_file"
      label="Read"
      target="notes/menu.md"
      kind="read"
      variant={variant as ChatToolCallVariant}
      status={callStatus}
      args={{ path: 'notes/menu.md' }}
      error={status === 'failed' ? 'The file is locked.' : undefined}
      durationMs={status === 'running' ? undefined : 400}
    />
  );
}

/** A pending approval offering the decisions in `options`, with or without a named scope. */
function OptionsCall({ options, scope }: { options: string; scope: string }) {
  const offers = new Set(options.split(' '));
  return (
    <ChatToolCall
      id={`options-${options}-${scope}`.replaceAll(' ', '-')}
      name="send_shopping_list"
      label="Send the shopping list to Ana"
      status="approval-requested"
      args={{ to: 'Ana', items: ['red lentils', 'lemons', 'cumin'] }}
      approval={scope === 'none' ? {} : { scopeLabel: scope }}
      onApprove={offers.has('approve') ? noop : undefined}
      onDeny={offers.has('deny') ? noop : undefined}
      onAlwaysAllow={offers.has('always') ? noop : undefined}
    />
  );
}

/** A decided approval, after the call ran or was refused. */
function DecisionCall({ decision, expansion }: { decision: string; expansion: string }) {
  const [approval, status] = decisions[decision as keyof typeof decisions];
  return (
    <ChatToolCall
      id={`decision-${decision}-${expansion}`.replaceAll(' ', '-')}
      name="search_recipes"
      status={status}
      args={recipeArgs}
      result={status === 'succeeded' ? recipeResult : undefined}
      durationMs={status === 'succeeded' ? 900 : undefined}
      approval={approval}
      onApprove={noop}
      onDeny={noop}
      onAlwaysAllow={noop}
      defaultExpanded={expansion === 'expanded'}
    />
  );
}

mountLab(
  <>
    <LabSection
      title="Statuses"
      description="Every status, with no details or with arguments (and a result once done), closed or open at first. A running call is busy, a failed one starts closed with its error at the top of its body, and one that asks for approval opens by default."
    >
      <StateMatrix
        axes={{
          status: statuses,
          details: ['none', 'args and result'],
          expansion: ['collapsed', 'expanded'],
        }}
        render={(cell) => <StatusCall {...cell} />}
      />
    </LabSection>
    <LabSection
      title="Variants"
      description="A card stands on its own; a row is the quiet call a reply's steps show, alone or in a group, with its status and duration kept for assistive technology once it ends. The variant changes no content or behaviour."
    >
      <StateMatrix
        axes={{ variant: ['card', 'row'], status: ['running', 'succeeded', 'failed'] }}
        render={(cell) => <VariantCall {...cell} />}
      />
    </LabSection>
    <LabSection
      title="Approval options"
      description="A pending approval offers Approve (Ctrl+Enter), Deny (Escape focuses it; it asks for an optional reason) and Always allow, each only when the host handles it. Always allow names the host's scope."
    >
      <StateMatrix
        axes={{ options: optionSets, scope: ['none', 'this conversation'] }}
        render={(cell) => <OptionsCall {...cell} />}
      />
    </LabSection>
    <LabSection
      title="Decisions"
      description="Once decided, the card keeps the decision in place of the buttons."
    >
      <StateMatrix
        axes={{
          decision: ['approved', 'denied', 'denied with reason', 'always'],
          expansion: ['collapsed', 'expanded'],
        }}
        render={(cell) => <DecisionCall {...cell} />}
      />
    </LabSection>
    <LabSection
      title="Auto-approved"
      description="A call that ran without asking, because the tool was always allowed, carries a badge."
    >
      <StateMatrix
        axes={{ status: ['running', 'succeeded'] }}
        render={({ status }) => (
          <ChatToolCall
            id={`auto-${status}`}
            name="search_recipes"
            status={status}
            args={recipeArgs}
            result={status === 'succeeded' ? recipeResult : undefined}
            durationMs={status === 'succeeded' ? 700 : undefined}
            approval={{ isAutoApproved: true }}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Custom body"
      description="A host draws its own view of a weather tool's result in place of the JSON."
    >
      <div data-lab-demo="custom-body">
        <ChatToolCall
          id="custom-weather"
          name="get_weather"
          label="Checked the weather in Porto"
          status="succeeded"
          args={{ city: 'Porto', days: 3 }}
          durationMs={640}
          defaultExpanded
        >
          <ForecastCard />
        </ChatToolCall>
      </div>
    </LabSection>
    <LabSection
      title="Long result"
      description="A long result scrolls inside its view, which takes keyboard focus to scroll."
    >
      <div data-lab-demo="long-result">
        <ChatToolCall
          id="long-timetable"
          name="search_trains"
          label="Searched trains from Lisbon to Porto"
          status="succeeded"
          args={{ from: 'Lisbon', to: 'Porto', date: '2026-05-14' }}
          result={timetableResult}
          durationMs={2300}
          defaultExpanded
        />
      </div>
    </LabSection>
    <LabSection
      title="Long label"
      description="A label too long for one line wraps beside the status glyph, which stays on the first line, and the status, duration and badge follow its last word."
    >
      <StateMatrix
        axes={{ 'long label': ['succeeded', 'running', 'failed'] }}
        render={({ 'long label': status }) => (
          <div style={{ width: 360 }}>
            <ChatToolCall
              id={`long-label-${status}`}
              name="plan_weekend"
              label="Compare the morning and afternoon trains from Lisbon to Porto for Saturday, keeping seats together"
              status={status}
              args={{ from: 'Lisbon', to: 'Porto', day: 'Saturday' }}
              error={status === 'failed' ? 'The timetable service did not answer.' : undefined}
              durationMs={status === 'running' ? undefined : 2300}
              approval={status === 'succeeded' ? { isAutoApproved: true } : undefined}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Interactive approval"
      description="Decide with the buttons or the keyboard: Ctrl+Enter (Cmd+Enter on macOS) approves, Escape focuses Deny. Approving runs the tool; Deny asks for an optional reason. Ask again resets the call."
    >
      <ApprovalDemo />
    </LabSection>
    <LabSection
      title="Next call in place"
      description="One card the host reuses for its next waiting call. Press Deny and type a reason, then press Next call (or move focus away and back): the other call shows with a fresh approval and no reason, and focus lands on its Deny button. Each decision names the call it reached."
    >
      <QueueDemo />
    </LabSection>
  </>,
);
