// Options of the Chat Parts lab: steps that open while they run or only on request, and a question
// card whose answered tabs show a check or leave the mark to the stylesheet.

import { useState } from 'react';
import {
  ChatParts,
  type ChatPart,
  type ChatQuestionPart,
} from '../../src/components/chat-parts/index.js';
import { Switch } from '../../src/components/switch/switch.js';
import { StateMatrix } from './chrome/index.js';
import { searchCall, tripQuestion } from './chat-parts-samples.js';

const reasoning = (isStreaming: boolean): ChatPart => ({
  type: 'reasoning',
  id: 'r1',
  text: 'Two sights a day keeps the weekend **calm**.',
  status: isStreaming ? 'streaming' : 'complete',
  durationMs: 2100,
});

const openings = ['automatically', 'on request'] as const;

/**
 * A message's steps, opening on their own while they run beside steps that wait for the reader
 * (`expandsActivity` false), driven by one Streaming switch.
 */
export function ActivityExpansion() {
  const [isStreaming, setStreaming] = useState(true);
  const parts: ChatPart[] = [
    reasoning(isStreaming),
    isStreaming ? { ...searchCall, status: 'running', durationMs: undefined } : searchCall,
  ];
  return (
    <div data-lab-demo="activity-expansion">
      <Switch isSelected={isStreaming} onChange={setStreaming}>
        Streaming
      </Switch>
      <StateMatrix
        axes={{ opens: openings }}
        render={({ opens }) => (
          <div style={{ width: 380 }}>
            <ChatParts
              parts={parts}
              isStreaming={isStreaming}
              messageId={`opens-${opens.replace(' ', '-')}`}
              expandsActivity={opens === 'automatically'}
            />
          </div>
        )}
      />
    </div>
  );
}

/** A pending question part with two questions, the first answered as soon as an option is picked. */
const twoQuestions: ChatQuestionPart = {
  ...tripQuestion,
  questions: [
    ...tripQuestion.questions,
    {
      id: 'stay',
      question: 'Where would you like to stay?',
      header: 'Stay',
      selectionMode: 'single',
      options: [
        { id: 'old-town', label: 'Old town' },
        { id: 'riverside', label: 'By the river' },
      ],
    },
  ],
};

const marks = ['icon', 'style'] as const;

/** The same two-question card with each answered mark; pick an answer to mark its tab. */
export function AnsweredMarks() {
  return (
    <StateMatrix
      axes={{ mark: marks }}
      render={({ mark }) => (
        <div style={{ width: 380 }}>
          <ChatParts
            parts={[{ ...twoQuestions, id: `ask-${mark}` }]}
            messageId={`marks-${mark}`}
            questionAnsweredMark={mark}
            onAnswerQuestion={() => undefined}
          />
        </div>
      )}
    />
  );
}
