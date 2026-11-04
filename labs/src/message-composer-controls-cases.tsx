// The message composer's row of controls: the "+" menu, an approval select, a plan toggle and the
// model picker at either end, the send button where the host puts it, a host's own control that
// drops its label, and the same row at narrower widths, where the controls shrink to their icons.
// Lab-only layout is inline.
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ChatModelPicker } from '../../src/components/chat-model-picker/chat-model-picker.js';
import {
  MessageComposer,
  MessageComposerAttachButton,
  MessageComposerEmojiButton,
  MessageComposerMenuButton,
  MessageComposerSelect,
  type MessageComposerSelectOption,
  MessageComposerSendButton,
  MessageComposerToggle,
  useMessageComposerControls,
} from '../../src/components/message-composer/index.js';
import {
  CheckGlyph,
  EditGlyph,
  FolderGlyph,
  HandRaisedGlyph,
  ListTaskGlyph,
  LockGlyph,
} from '../../src/core/glyphs.js';
import { describeModelChoice, labEfforts, labModels } from './chat-model-samples.js';
import { LabSection } from './chrome/index.js';
import { createLabComposerMenu } from './message-composer-menu-cases.js';

export const labApprovalModes: MessageComposerSelectOption[] = [
  {
    id: 'ask',
    label: 'Ask first',
    icon: HandRaisedGlyph,
    description: 'Approve each change before it is made',
  },
  { id: 'edits', label: 'Accept edits', icon: EditGlyph, description: 'Edit files without asking' },
  { id: 'auto', label: 'Run on its own', icon: CheckGlyph, description: 'Never stop to ask' },
  {
    id: 'locked',
    label: 'Read only',
    icon: LockGlyph,
    description: 'Change nothing',
    isDisabled: true,
    disabledReason: 'Only an owner can turn this on',
  },
];

const widths = { wide: undefined, medium: 440, narrow: 300 } as const;

/** A host's own control: the files in context, with its icon alone while the row is compact. */
function ContextControl({ count }: { count: number }) {
  const { isCompact, isDisabled } = useMessageComposerControls();
  const label = `${count} files in context`;
  const button = {
    size: 'sm',
    variant: 'ghost',
    isDisabled,
    'data-lab-control': 'context',
  } as const;
  return isCompact ? (
    <Button {...button} icon={FolderGlyph} label={label} tooltip={label} />
  ) : (
    <Button {...button} startIcon={FolderGlyph}>
      {label}
    </Button>
  );
}

/**
 * A host's own control that shows how often it rendered: typing leaves it alone until what the
 * controls show changes, such as the composer having something to send.
 */
function RenderCount() {
  useMessageComposerControls();
  const output = useRef<HTMLSpanElement>(null);
  const renders = useRef(0);
  // Counted as each render commits, and written straight to the element, so counting renders nothing.
  useEffect(() => {
    renders.current += 1;
    if (output.current) output.current.textContent = `Rendered ${renders.current} times`;
  });
  return <span ref={output} data-lab-output="leading-send-renders" />;
}

/** The choices the controls hold, shared by every composer of the section. */
function useControlChoices() {
  const [approval, setApproval] = useState('ask');
  const [isPlanning, setPlanning] = useState(false);
  const [model, setModel] = useState('balanced');
  const [effort, setEffort] = useState('medium');
  return {
    approval,
    isPlanning,
    model: describeModelChoice(model, effort),
    start: (
      <>
        <MessageComposerMenuButton
          {...createLabComposerMenu({ isPlanning, onPlanningChange: setPlanning })}
        />
        <MessageComposerSelect
          label="Approval"
          options={labApprovalModes}
          value={approval}
          onChange={setApproval}
        />
        <MessageComposerToggle
          label="Plan"
          icon={ListTaskGlyph}
          isSelected={isPlanning}
          onChange={setPlanning}
        />
      </>
    ),
    end: (
      <ChatModelPicker
        models={labModels}
        efforts={labEfforts}
        model={model}
        onModelChange={setModel}
        effort={effort}
        onEffortChange={setEffort}
      />
    ),
  };
}

/** The same controls at three widths; the wide one can be resized by its corner. */
function ControlRows() {
  const choices = useControlChoices();
  const [sent, setSent] = useState('nothing');
  return (
    <>
      {(Object.keys(widths) as Array<keyof typeof widths>).map((width) => (
        <div
          key={width}
          data-lab-row={width}
          style={
            width === 'wide'
              ? { resize: 'horizontal', overflow: 'hidden', minWidth: 200, maxWidth: '100%' }
              : { width: widths[width] }
          }
        >
          <MessageComposer
            aria-label={`Prompt (${width})`}
            placeholder="Ask anything"
            onAttach={() => undefined}
            startControls={choices.start}
            endControls={choices.end}
            onSubmit={(text) =>
              setSent(
                `${text} (${choices.approval}, plan ${choices.isPlanning ? 'on' : 'off'}, ${choices.model})`,
              )
            }
            data-lab-composer={`controls-${width}`}
          />
        </div>
      ))}
      <p>
        Sent: <output data-lab-output="controls-sent">{sent}</output>
      </p>
    </>
  );
}

/** The send button first, beside a host's own control, then the attach and emoji buttons at the end. */
function LeadingSend() {
  const [sent, setSent] = useState('nothing');
  return (
    <>
      <div data-lab-row="leading-send" style={{ maxWidth: 520 }}>
        <MessageComposer
          aria-label="Message with Send first"
          placeholder="Send sits at the start here"
          onAttach={() => undefined}
          startControls={
            <>
              <MessageComposerSendButton />
              <ContextControl count={3} />
              <RenderCount />
            </>
          }
          endControls={
            <>
              <MessageComposerAttachButton />
              <MessageComposerEmojiButton />
            </>
          }
          onSubmit={setSent}
          data-lab-composer="leading-send"
        />
      </div>
      <p>
        Sent: <output data-lab-output="leading-send-sent">{sent}</output>
      </p>
    </>
  );
}

export function ComposerControlsSection() {
  return (
    <LabSection
      title="Controls"
      description="Any controls, in any order, at the start or the end of the row below the text: the + menu, an approval select, a Plan toggle and the model picker, with Send last. When the row is too narrow for their labels (the medium and narrow rows, or drag the wide one's corner) the composer turns compact and each control shows its icon alone, named and hinted by its label. The host may place Send itself, here first, and its own controls can read whether the row is compact, as the files-in-context count does. Typing renders no control again until what they show changes: the render count beside it moves when the text first gives Send something to send, then holds."
    >
      <ControlRows />
      <LeadingSend />
    </LabSection>
  );
}
