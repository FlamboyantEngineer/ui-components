import { useState } from 'react';
import {
  ChatModelPicker,
  type ChatModelPickerProps,
} from '../../src/components/chat-model-picker/index.js';
import { Stack } from '../../src/components/layout/layout.js';
import { MessageComposer } from '../../src/components/message-composer/index.js';
import { labEfforts, labModels } from './chat-model-samples.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const states = ['with efforts', 'without efforts', 'model without effort', 'disabled'] as const;

const stateProps: Record<(typeof states)[number], Partial<ChatModelPickerProps>> = {
  'with efforts': { defaultModel: 'balanced', defaultEffort: 'high' },
  'without efforts': { defaultModel: 'balanced', efforts: undefined },
  'model without effort': { defaultModel: 'classic' },
  disabled: { defaultModel: 'deep', isDisabled: true },
};

/** The host holds the model and effort and prints them, with every value the picker reported. */
function ControlledDemo() {
  const [model, setModel] = useState('swift');
  const [effort, setEffort] = useState('low');
  const [reports, setReports] = useState<string[]>([]);
  const report = (line: string) => setReports((lines) => [...lines.slice(-3), line]);
  return (
    <Stack space="sm" align="start" data-lab-demo="controlled">
      <ChatModelPicker
        models={labModels}
        efforts={labEfforts}
        model={model}
        effort={effort}
        onModelChange={(id) => {
          setModel(id);
          report(`model ${id}`);
        }}
        onEffortChange={(id) => {
          setEffort(id);
          report(`effort ${id}`);
        }}
      />
      <p>
        Model: <output data-lab-output="model">{model}</output>
        {' · '}
        Effort: <output data-lab-output="effort">{effort}</output>
        {' · '}
        Reported: <output data-lab-output="reported">{reports.join(', ') || 'nothing yet'}</output>
      </p>
    </Stack>
  );
}

/** The picker among a composer's tools, where it usually sits. */
function ComposerDemo() {
  const [sent, setSent] = useState('nothing yet');
  const [model, setModel] = useState('balanced');
  return (
    <Stack space="sm" data-lab-demo="composer">
      <MessageComposer
        placeholder="Ask anything…"
        onSubmit={(text) => setSent(`“${text}” to ${model}`)}
        endControls={
          <ChatModelPicker
            models={labModels}
            efforts={labEfforts}
            model={model}
            onModelChange={setModel}
          />
        }
      />
      <p>
        Sent: <output data-lab-output="sent">{sent}</output>
      </p>
    </Stack>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="The trigger shows the model, and its effort while the model takes one; the first picker starts at Balanced with the high effort (defaultModel, defaultEffort). Open a picker: the models come first, each with a description, Deep with a New badge and Max, in preview, unavailable with its reason (the arrow keys reach it, but it cannot be chosen); the efforts the chosen model takes follow. Swift takes low and medium, Deep medium and high, Balanced every effort and Classic none, so its menu has no efforts. Without efforts no model takes one. A disabled picker does not open."
    >
      <StateMatrix
        axes={{ state: states }}
        render={({ state }) => (
          <ChatModelPicker models={labModels} efforts={labEfforts} {...stateProps[state]} />
        )}
      />
    </LabSection>
    <LabSection
      title="Remembered choice"
      description="With persistKey, the picker keeps the model and effort you choose in the provider storage. Choose some, then reload the page: the picker comes back with your choice."
    >
      <div data-lab-demo="persisted">
        <ChatModelPicker
          models={labModels}
          efforts={labEfforts}
          persistKey="lab-chat-model-picker"
        />
      </div>
    </LabSection>
    <LabSection
      title="Controlled"
      description="The host holds the model and effort and prints what the picker reports. Choosing a model that does not take the current effort also reports the effort it moves to: from Swift at low, Deep moves to high, its default."
    >
      <ControlledDemo />
    </LabSection>
    <LabSection
      title="In a composer"
      description="Passed as a composer's toolbar, the picker sits with its tools beside the send button; the host reads the model when the message is sent."
    >
      <ComposerDemo />
    </LabSection>
  </>,
);
