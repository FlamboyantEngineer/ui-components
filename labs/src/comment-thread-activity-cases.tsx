import { useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  CommentThread,
  type CommentThreadActivity,
  CommentThreadReply,
} from '../../src/components/comment-thread/index.js';
import { Switch } from '../../src/components/switch/switch.js';
import { samplePicture } from './people-samples.js';

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', src: samplePicture, colorKey: 'jon' };
const time = '2026-04-20T09:40:00';

interface PostedComment {
  id: string;
  text: string;
}

/**
 * A thread whose replies take a second to post: a pending row with Cancel while one posts, every
 * second one fails with Retry, and a switch shows Jon typing.
 */
export function ActivityThread() {
  const [comments, setComments] = useState<readonly PostedComment[]>([
    { id: 'c1', text: 'Shall we bake the pear tart on Monday?' },
  ]);
  const [posting, setPosting] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [isTyping, setTyping] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (posting === null) return;
    const timer = setTimeout(() => {
      setAttempt(attempt + 1);
      setPosting(null);
      if (attempt % 2 === 0) setFailed(posting);
      else setComments((list) => [...list, { id: `c${list.length + 1}`, text: posting }]);
    }, 1000);
    return () => clearTimeout(timer);
  }, [posting, attempt]);
  const post = (text: string) => {
    setFailed(null);
    setPosting(text);
  };
  const activity: CommentThreadActivity[] = [];
  if (posting !== null) {
    activity.push({
      key: 'posting',
      kind: 'pending',
      label: 'Posting your reply…',
      onCancel: () => setPosting(null),
    });
  }
  if (isTyping) activity.push({ key: 'jon', kind: 'typing', label: 'Jon Berg is typing…' });
  if (failed !== null) {
    activity.push({
      key: 'failed',
      kind: 'error',
      label: 'Your reply was not posted.',
      onRetry: () => post(failed),
    });
  }
  return (
    <div data-lab-demo="activity">
      <Switch isSelected={isTyping} onChange={setTyping}>
        Jon is typing
      </Switch>
      <CommentThread aria-label="Tart thread" activity={activity} onReply={post}>
        {comments.map((comment, index) => (
          <CommentThreadReply
            key={comment.id}
            id={comment.id}
            author={index === 0 ? jon : maria}
            time={time}
            text={comment.text}
          />
        ))}
      </CommentThread>
    </div>
  );
}

const fruit = ['Apples', 'Bananas', 'Cherries', 'Dates', 'Figs', 'Grapes', 'Kiwis'];

/** A long thread in a short scrolled panel: pick a comment to highlight it and bring it in view. */
export function HighlightThread() {
  const [highlightedId, setHighlightedId] = useState<string | undefined>(undefined);
  return (
    <div data-lab-demo="highlight">
      <div role="group" aria-label="Highlight">
        {['fruit-2', 'fruit-6', 'fruit-1'].map((id) => (
          <Button key={id} size="sm" variant="secondary" onPress={() => setHighlightedId(id)}>
            Highlight {id.replace('fruit-', 'comment ')}
          </Button>
        ))}
      </div>
      <div data-lab-panel="highlight" style={{ height: 220, overflow: 'auto' }}>
        <CommentThread aria-label="Fruit thread" visibleReplies={2} highlightedId={highlightedId}>
          {fruit.map((name, index) => (
            <CommentThreadReply
              key={name}
              id={`fruit-${index + 1}`}
              author={index % 2 === 0 ? maria : jon}
              time={time}
              text={`${name} are on the list.`}
            />
          ))}
        </CommentThread>
      </div>
    </div>
  );
}
