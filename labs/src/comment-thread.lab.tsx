import { LinkGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import { CommentComposer } from '../../src/components/comment-composer/comment-composer.js';
import { CommentThread } from '../../src/components/comment-thread/comment-thread.js';
import { CommentThreadReply } from '../../src/components/comment-thread/index.js';
import { ReactionBar, type ReactionEntry } from '../../src/components/reaction-bar/reaction-bar.js';
import { Switch } from '../../src/components/switch/switch.js';
import { CommentThreadZoneCases } from './comment-thread-zone-cases.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { MentionThread } from './comment-thread-mentions.js';
import { samplePicture } from './people-samples.js';

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', src: samplePicture, colorKey: 'jon' };
const lena = { name: 'Lena Ortiz', colorKey: 'lena' };
const people = [maria, jon, lena];

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** A fixed reading clock, so the frozen section reads the same on every visit. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

const quote = 'Ship the tasting samples by Friday';

interface LabComment {
  id: number;
  author: (typeof people)[number];
  time: string;
  text: string;
  isEdited?: boolean;
  reactions: ReactionEntry[];
}

const opening: LabComment[] = [
  {
    id: 1,
    author: jon,
    time: minutesAgo(180),
    text: 'Can we move this to Monday? The pears are not ripe yet.',
    reactions: [{ emoji: '👍', people: ['Lena Ortiz'] }],
  },
  {
    id: 2,
    author: maria,
    time: minutesAgo(42),
    text: 'Monday works for the kitchen.',
    isEdited: true,
    reactions: [],
  },
  { id: 3, author: lena, time: minutesAgo(5), text: 'Agreed, Monday it is.', reactions: [] },
];

const fruit = ['Apples', 'Bananas', 'Cherries', 'Dates', 'Figs', 'Grapes', 'Kiwis'];
const longThread: LabComment[] = fruit.map((name, index) => ({
  id: index + 1,
  author: people[index % people.length] ?? maria,
  time: minutesAgo(60 - index * 5),
  text: `${name} are on the list.`,
  reactions: [],
}));

/** Toggles the reader's reaction, as a host keeping the counts would. */
function toggleReaction(reactions: ReactionEntry[], emoji: string, isReacted: boolean) {
  const found = reactions.some((reaction) => reaction.emoji === emoji);
  const list = found ? reactions : [...reactions, { emoji, people: [] }];
  return list.map((reaction) => {
    if (reaction.emoji !== emoji) return reaction;
    const others = (reaction.people ?? []).filter((name) => name !== maria.name);
    return { ...reaction, isReacted, people: isReacted ? [maria.name, ...others] : others };
  });
}

/** Comments as an array of elements, so the thread lists and collapses each one. */
function renderComments(comments: readonly LabComment[]) {
  return comments.map((comment) => (
    <CommentThreadReply
      key={comment.id}
      author={comment.author}
      time={comment.time}
      text={comment.text}
      isEdited={comment.isEdited}
      onEdit={() => {}}
      onDelete={() => {}}
      reactions={<ReactionBar reactions={comment.reactions} />}
    />
  ));
}

/** A thread the reader can reply to, react in, edit and delete their own comments, and resolve. */
function LiveThread() {
  const [comments, setComments] = useState(opening);
  const [failNext, setFailNext] = useState(false);
  const [canChange, setCanChange] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState('nothing yet');
  const update = (id: number, change: (comment: LabComment) => LabComment) =>
    setComments((list) => list.map((comment) => (comment.id === id ? change(comment) : comment)));
  const reply = (text: string) => {
    if (failNext) {
      setError('The reply could not be posted. Try again.');
      return Promise.reject(new Error('offline'));
    }
    setError(null);
    setComments((list) => [
      ...list,
      { id: list.length + 1, author: maria, time: new Date().toISOString(), text, reactions: [] },
    ]);
    return undefined;
  };
  // Edits and deletes reach the host after a moment, and fail while the failure switch is on.
  const settle = (change: () => void) =>
    new Promise<void>((resolve, reject) =>
      setTimeout(() => {
        if (failNext) {
          reject(new Error('The change could not be saved. Try again.'));
          return;
        }
        change();
        resolve();
      }, 600),
    );
  const isMine = (comment: LabComment) => canChange && comment.author === maria;
  return (
    <div>
      <Switch isSelected={failNext} onChange={setFailNext}>
        Fail the next reply, edit or delete
      </Switch>{' '}
      <Switch isSelected={canChange} onChange={setCanChange}>
        Allow changing my comments
      </Switch>
      <CommentThread
        quote={quote}
        onReply={reply}
        defaultResolved={false}
        onResolvedChange={(isResolved) => setLastAction(isResolved ? 'resolved' : 'reopened')}
        error={error}
        data-lab-thread="live"
      >
        {comments.map((comment) => (
          <CommentThreadReply
            key={comment.id}
            author={comment.author}
            time={comment.time}
            text={comment.text}
            isEdited={comment.isEdited}
            actions={[{ id: 'copy-link', label: 'Copy link', icon: LinkGlyph }]}
            onAction={(key) => setLastAction(`${String(key)} on comment ${comment.id}`)}
            onEdit={
              isMine(comment)
                ? (text) =>
                    settle(() =>
                      update(comment.id, (current) => ({ ...current, text, isEdited: true })),
                    )
                : undefined
            }
            onDelete={
              isMine(comment)
                ? () =>
                    settle(() =>
                      setComments((list) => list.filter((item) => item.id !== comment.id)),
                    )
                : undefined
            }
            reactions={
              <ReactionBar
                reactions={comment.reactions}
                onToggle={(emoji, isReacted) =>
                  update(comment.id, (current) => ({
                    ...current,
                    reactions: toggleReaction(current.reactions, emoji, isReacted),
                  }))
                }
              />
            }
          />
        ))}
      </CommentThread>
      <p>
        Last action: <output data-lab-output="action">{lastAction}</output>
      </p>
    </div>
  );
}

/** Bodies rendered by the caller, with a caller composer and editor in place of the defaults. */
function CallerContent() {
  const [text, setText] = useState('Use **bold** for the deadline.');
  return (
    <CommentThread
      composer={
        <CommentComposer
          label="Reply in Markdown"
          placeholder="**bold**, _italic_"
          onSubmit={() => {}}
        />
      }
      data-lab-thread="caller"
    >
      <CommentThreadReply
        author={jon}
        time={minutesAgo(12)}
        text={text}
        onEdit={setText}
        renderEditor={(options) => (
          <CommentComposer {...options} label="Edit Markdown" submitLabel="Update" autoFocus />
        )}
      >
        {text
          .split('**')
          .map((part, index) => (index % 2 ? <strong key={index}>{part}</strong> : part))}
      </CommentThreadReply>
    </CommentThread>
  );
}

/** A long thread with icon-only Resolve and Reopen, indented or flat. */
function IndentedThread({ isIndented }: { isIndented: boolean }) {
  const [isResolved, setIsResolved] = useState(false);
  return (
    <CommentThread
      quote={quote}
      resolveIconOnly
      indentReplies={isIndented}
      isResolved={isResolved}
      onResolvedChange={setIsResolved}
      visibleReplies={2}
      onReply={() => {}}
      data-lab-thread={isIndented ? 'indented' : 'flat'}
    >
      {renderComments(longThread.slice(0, 5))}
    </CommentThread>
  );
}

/** A resolved thread with a text or icon-only Resolved chip, interactive or read-only. */
function StatusThread({
  chip,
  mode,
}: {
  chip: 'text' | 'icon';
  mode: 'interactive' | 'read-only';
}) {
  const [isResolved, setIsResolved] = useState(true);
  const isIcon = chip === 'icon';
  return (
    <CommentThread
      quote={quote}
      statusIconOnly={isIcon}
      resolveIconOnly={isIcon}
      indentReplies={isIcon}
      isResolved={isResolved}
      onResolvedChange={setIsResolved}
      isReadOnly={mode === 'read-only'}
      onReply={() => {}}
      data-lab-thread={`status-${chip}-${mode}`}
    >
      {renderComments(longThread.slice(0, 2))}
    </CommentThread>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="A new thread with only its composer, an open discussion and a resolved one, interactive and read-only."
    >
      <StateMatrix
        axes={{ thread: ['new', 'open', 'resolved'], mode: ['interactive', 'read-only'] }}
        render={({ thread, mode }) => (
          <CommentThread
            quote={quote}
            isResolved={thread === 'resolved'}
            onResolvedChange={() => {}}
            isReadOnly={mode === 'read-only'}
            isSelected={thread === 'open' && mode === 'interactive'}
            onReply={() => {}}
          >
            {thread === 'new' ? null : renderComments(opening.slice(0, 2))}
          </CommentThread>
        )}
      />
    </LabSection>
    <LabSection
      title="Long thread"
      description="Seven comments showing the opening one and the latest two; the button reveals the rest and focuses the first revealed reply. The replies come in a fragment, and count one by one."
    >
      <CommentThread visibleReplies={2} data-lab-thread="long">
        {renderComments(longThread.slice(0, 1))}
        <>{renderComments(longThread.slice(1))}</>
      </CommentThread>
    </LabSection>
    <LabSection
      title="Icon resolve and indented replies"
      description="Resolve and Reopen as icon buttons named by their tooltip, and every reply indented whole under the opening comment, beside flat replies. The long thread shows its latest two replies: reveal the rest, which indent alike. Resolve, then reopen."
    >
      <StateMatrix
        axes={{ replies: ['indented', 'flat'] }}
        render={({ replies }) => <IndentedThread isIndented={replies === 'indented'} />}
      />
    </LabSection>
    <LabSection
      title="State chips"
      description="The Resolved chip as text, or as an icon-only chip named by its tooltip (hover it or Tab to it), beside the icon-only Resolve and Reopen and indented replies. Reopen and resolve the interactive threads; the read-only ones keep the chip with no action."
    >
      <StateMatrix
        axes={{ chip: ['text', 'icon'], mode: ['interactive', 'read-only'] }}
        render={({ chip, mode }) => <StatusThread chip={chip} mode={mode} />}
      />
    </LabSection>
    <LabSection
      title="Live"
      description="Reply (Ctrl+Enter sends), react, edit or delete your own comments from their menu, copy a link, and resolve or reopen: an unsent reply waits, hidden, while the thread is resolved. Edits and deletes take a moment to save: the editor or the confirmation stays open, pending, until they do. Switch on the failure to see the error and the kept draft or edit. Switch off changing your comments while editing or confirming: the editor or confirmation ends, and does not come back when you switch it on."
    >
      <LiveThread />
    </LabSection>
    <LabSection
      title="Mentions, emoji and reactions"
      description="The thread's composer and editor are the rich composer: type @ and pick a person to insert a pill, or use the emoji button to insert at the caret. Sent comments draw their mentions as pills through the chat parts renderer, and editing your own comment starts from its mentions and keeps them. Add a reaction from the smiley button, or press a reaction to toggle yours."
    >
      <MentionThread />
    </LabSection>
    <LabSection
      title="Frozen clock"
      description="Comments read against a fixed clock, with dates after seven days or after one."
    >
      <StateMatrix
        axes={{ fallback: ['7 days', '1 day'] }}
        render={({ fallback }) => (
          <CommentThread isReadOnly>
            {[
              { id: 'a', author: jon, time: '2026-04-20T10:18:00', text: 'Pears are in.' },
              { id: 'b', author: lena, time: '2026-04-17T16:00:00', text: 'Plums next week.' },
            ].map((comment) => (
              <CommentThreadReply
                key={comment.id}
                author={comment.author}
                time={comment.time}
                text={comment.text}
                getNow={getNow}
                fallbackAfterDays={fallback === '7 days' ? 7 : 1}
              />
            ))}
          </CommentThread>
        )}
      />
    </LabSection>
    <LabSection
      title="Caller content"
      description="A body the caller renders (bold from Markdown-like text), a caller composer and a caller editor."
    >
      <CallerContent />
    </LabSection>
    <CommentThreadZoneCases />
  </>,
);
