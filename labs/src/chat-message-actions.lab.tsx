import { useState } from 'react';
import {
  ChatMessageActions,
  type ChatFeedback,
  type ChatFeedbackRating,
  type ChatMessageCommandProps,
} from '../../src/components/chat-message-actions/chat-message-actions.js';
import {
  ConversationDemo,
  describeFeedback,
  feedbackReasons,
} from './chat-message-actions-conversation.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const commandSets = ['copy', 'ratings', 'reasons', 'reply', 'own', 'all'] as const;
type CommandSet = (typeof commandSets)[number];

const ratings = ['none', 'up', 'down'] as const;
const details = ['at-once', 'reasons'] as const;

/** The commands of a set, reporting each call to `log`. */
function commandsOf(set: CommandSet, log: (entry: string) => void): ChatMessageCommandProps {
  const copy = { copyText: 'Take the 28 tram to the castle, then walk down to the river.' };
  const ratings = { onFeedback: (feedback: ChatFeedback) => log(describeFeedback(feedback)) };
  const human = {
    onReply: () => log('reply'),
    onReact: (emoji: string) => log(`react ${emoji}`),
  };
  const own = { onEdit: () => log('edit'), onDelete: () => log('delete') };
  const sets: Record<CommandSet, ChatMessageCommandProps> = {
    copy,
    ratings: { ...copy, ...ratings },
    reasons: { ...copy, ...ratings, feedbackReasons },
    reply: { ...copy, ...human },
    own: { ...human, ...own },
    all: { ...copy, ...ratings, feedbackReasons, ...human, ...own },
  };
  return sets[set];
}

/** One command set's bar, with the last call it reported. */
function CommandCell({ set }: { set: CommandSet }) {
  const [entry, setEntry] = useState('');
  return (
    <div>
      <ChatMessageActions {...commandsOf(set, setEntry)} data-lab-bar={set} />
      <output data-lab-log={set}>{entry}</output>
    </div>
  );
}

/** A rating bar starting at `rating`, held by the lab as a host would. */
function RatingCell({
  rating,
  detail,
}: {
  rating: (typeof ratings)[number];
  detail: (typeof details)[number];
}) {
  const [feedback, setFeedback] = useState<ChatFeedbackRating | null>(
    rating === 'none' ? null : rating,
  );
  return (
    <ChatMessageActions
      copyText="The castle opens at nine."
      feedback={feedback}
      onFeedback={(next) => setFeedback(next.rating)}
      feedbackReasons={detail === 'reasons' ? feedbackReasons : undefined}
    />
  );
}

mountLab(
  <>
    <LabSection
      title="Commands"
      description="Each command shows only when its callback is given: copy alone, ratings, ratings that ask for reasons, a received message's reply and react, the reader's own message, and every command. Arrow keys move between the commands; the line below each bar shows what it last reported. Press Copy to see the copied state, a rating with reasons to open the feedback details, React for the emoji picker and Delete for the confirmation."
    >
      <StateMatrix
        axes={{ commands: commandSets }}
        render={({ commands }) => <CommandCell set={commands} />}
      />
    </LabSection>
    <LabSection
      title="Ratings"
      description="No rating, rated up and rated down, reported at once or after the feedback details. Pressing the chosen rating again clears it."
    >
      <StateMatrix
        axes={{ details, rating: ratings }}
        render={({ details: detail, rating }) => <RatingCell rating={rating} detail={detail} />}
      />
    </LabSection>
    <LabSection
      title="In a conversation"
      description="The bar shows while a message is hovered or holds focus, and stays while its overlays are open. A secondary click, a long press, the Context Menu key or Shift+F10 on a message opens the same commands as a menu; a secondary click in the draft field keeps the browser's menu. React, from the bar or the menu, adds the emoji to one small chip that overlaps the bottom right of the message: a stack of the emoji and the total. Pressing the chip opens the picker, where choosing an emoji you reacted with takes it back."
    >
      <ConversationDemo />
    </LabSection>
  </>,
);
