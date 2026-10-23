import { useState } from 'react';
import {
  AnnotationLayer,
  AnnotationMargin,
  type Annotation,
  type AnnotationCardState,
} from '../../src/components/annotation-layer/annotation-layer.js';
import { Button } from '../../src/components/button/button.js';
import { CommentThread } from '../../src/components/comment-thread/comment-thread.js';
import { CommentThreadReply } from '../../src/components/comment-thread/comment-thread-reply.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', colorKey: 'jon' };
const lena = { name: 'Lena Ortiz', colorKey: 'lena' };

interface Note {
  author: typeof maria;
  quote: string;
  text: string;
}

const noteText: Record<string, Note> = {
  kitchen: { author: jon, quote: 'Oven corner', text: 'The oven sits too close to the sink.' },
  butter: {
    author: maria,
    quote: 'Rub the butter into the flour',
    text: 'Use cold butter, straight from the fridge.',
  },
  blind: {
    author: lena,
    quote: 'bake the shell blind',
    text: 'Fifteen minutes is short for a deep tin. Try twenty.',
  },
  pantry: { author: jon, quote: 'Pantry shelf', text: 'This paragraph was removed.' },
};

/** Anchors: a region of the plan by rectangle, two phrases by element, and one lost anchor. */
function createAnnotations(prefix: string): Annotation[] {
  return [
    { id: 'kitchen', rects: [{ top: 8, left: 164, width: 88, height: 56 }] },
    { id: 'butter', targetId: `${prefix}-butter` },
    { id: 'blind', targetId: `${prefix}-blind` },
    { id: 'pantry', targetId: `${prefix}-pantry` },
  ];
}

function renderCard(annotation: Annotation, { isActive, isOrphaned }: AnnotationCardState) {
  const note = noteText[String(annotation.id)]!;
  return (
    <CommentThread
      aria-label={`Note on ${note.quote}`}
      quote={isOrphaned ? `${note.quote} (anchor removed)` : note.quote}
      isSelected={isActive}
      isReadOnly
    >
      <CommentThreadReply author={note.author} time="2026-04-20T09:30:00" text={note.text} />
    </CommentThread>
  );
}

function Plan() {
  return (
    <svg width="260" height="72" viewBox="0 0 260 72" role="img" aria-label="Kitchen plan">
      <rect x="1" y="1" width="258" height="70" fill="none" stroke="currentColor" />
      <line x1="160" y1="1" x2="160" y2="71" stroke="currentColor" />
      <text x="16" y="40" fill="currentColor" fontSize="12">
        Dining
      </text>
      <text x="180" y="40" fill="currentColor" fontSize="12">
        Kitchen
      </text>
    </svg>
  );
}

function Method({ prefix, isLong = false }: { prefix: string; isLong?: boolean }) {
  return (
    <div data-lab-notes-content>
      <Plan />
      {isLong ? (
        <p>
          Weigh everything before you start: the pastry is quick once the butter is out of the
          fridge, and warm hands make it tough.
        </p>
      ) : null}
      <p>
        <span id={`${prefix}-butter`}>Rub the butter into the flour</span> until it looks like
        breadcrumbs, then stir in the sugar and one egg yolk. Chill the pastry for 30 minutes, roll
        it out and line the tin.
      </p>
      <p>
        Prick the base, line it with paper and beans, and{' '}
        <span id={`${prefix}-blind`}>bake the shell blind</span> for 15 minutes.
      </p>
    </div>
  );
}

/** A review the reader works through: press a mark or a card, or move between cards by keyboard. */
function LiveReview() {
  const [activeId, setActiveId] = useState<Key | null>(null);
  const [isLong, setLong] = useState(false);
  return (
    <div data-lab-demo="live">
      <p>
        <Button size="sm" onPress={() => setLong(!isLong)}>
          {isLong ? 'Remove the intro' : 'Add an intro'}
        </Button>{' '}
        Active: <output data-lab-active>{activeId ?? 'none'}</output>
      </p>
      <AnnotationLayer
        annotations={createAnnotations('live')}
        activeId={activeId}
        onActiveChange={setActiveId}
      >
        <Method prefix="live" isLong={isLong} />
        <AnnotationMargin aria-label="Review notes" renderCard={renderCard} />
      </AnnotationLayer>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Anchors and cards"
      description="A region of the plan anchored by a rectangle, two phrases anchored by element, and a note whose anchor was removed. Cards align with the first line of multi-line anchors and stack without overlap; the active card stays level with its anchor, with the default and a wider gap."
    >
      <StateMatrix
        axes={{ active: ['none', 'kitchen', 'blind'], gap: ['8', '24'] }}
        render={({ active, gap }) => {
          const prefix = `${active}-${gap}`;
          return (
            <AnnotationLayer
              annotations={createAnnotations(prefix)}
              defaultActiveId={active === 'none' ? null : active}
            >
              <Method prefix={prefix} />
              <AnnotationMargin
                aria-label={`Notes, ${active} active, gap ${gap}`}
                gap={Number(gap)}
                renderCard={renderCard}
              />
            </AnnotationLayer>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Live review"
      description="Press a highlight or a card to make it active, or Tab to the cards and move with the arrow keys, Home and End. Adding an intro moves the phrases: the layer measures them again and the cards follow."
    >
      <LiveReview />
    </LabSection>
    <LabSection
      title="Numeric and text IDs"
      description="The numeric ID 1 and the text ID '1' identify separate cards."
    >
      <AnnotationLayer
        annotations={[
          { id: 1, rects: [{ top: 0, left: 0, width: 20, height: 20 }] },
          { id: '1', rects: [{ top: 40, left: 0, width: 20, height: 20 }] },
        ]}
      >
        <p>Two annotations with different primitive ID types.</p>
        <AnnotationMargin renderCard={(annotation) => `${typeof annotation.id} ID card`} />
      </AnnotationLayer>
    </LabSection>
  </>,
);
