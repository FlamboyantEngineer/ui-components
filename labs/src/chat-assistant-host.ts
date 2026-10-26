// What the Chat lab's live assistants share: the model choice their replies name, and the host's
// handlers for Copy, Apply and ratings, with a log of what the host received.

import { useState } from 'react';
import type { ChatFeedback } from '../../src/components/chat-message-actions/index.js';
import type { ChatModelPickerProps } from '../../src/components/chat-model-picker/index.js';
import type { LabSetMessages } from './chat-people-host.js';
import { describeModelChoice, labEfforts, labModels } from './chat-model-samples.js';

const feedbackReasons = ['Accurate', 'Helpful', 'Too long', 'Out of date'];

/** The callbacks the host received, newest last, for the lab to show. */
export function useCallbackLog() {
  const [log, setLog] = useState<string[]>([]);
  return [log, (line: string) => setLog((lines) => [...lines.slice(-5), line])] as const;
}

/**
 * The model picker's choice, controlled, and its words for the reply to name: the host reads the
 * picker's current choice when the reader sends.
 */
export function useLabModelChoice(): { modelPicker: ChatModelPickerProps; choice: string } {
  const [model, setModel] = useState('balanced');
  const [effort, setEffort] = useState('medium');
  return {
    modelPicker: {
      models: labModels,
      efforts: labEfforts,
      model,
      onModelChange: setModel,
      effort,
      onEffortChange: setEffort,
    },
    choice: describeModelChoice(model, effort),
  };
}

/** The host's Copy, Apply and rating handlers for the replies, each recorded; a rating sticks. */
export function createReplyHandlers(setMessages: LabSetMessages, record: (line: string) => void) {
  return {
    feedbackReasons,
    onCopy: (id: string) => record(`copied ${id}`),
    onApplyCode: (code: string) => record(`applied ${code.split('\n').length} lines`),
    onFeedback: (id: string, feedback: ChatFeedback) => {
      record(`rated ${feedback.rating ?? 'none'} ${feedback.reasons.join(', ')}`.trim());
      setMessages((messages) =>
        messages.map((message) =>
          message.id === id ? { ...message, feedback: feedback.rating ?? undefined } : message,
        ),
      );
    },
  };
}
