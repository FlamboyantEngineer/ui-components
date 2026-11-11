import { useState } from 'react';
import {
  type Annotation,
  type AnnotationCardState,
  AnnotationLayer,
  AnnotationMargin,
} from '../../src/components/annotation-layer/annotation-layer.js';
import { Button } from '../../src/components/button/button.js';
import { CommentThread } from '../../src/components/comment-thread/comment-thread.js';
import { CommentThreadReply } from '../../src/components/comment-thread/index.js';
import { ChatBubbleCheckGlyph } from '../../src/core/drawn-glyphs.js';
import type { Key } from '../../src/core/props.js';
import { ZoomedReview } from './annotation-layer-cases.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { requireDefined } from './require-defined.js';
import { ShadowRootApp } from './shadow-root-host.js';

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
  beans: { author: maria, quote: 'paper and beans', text: 'Rice works as well as beans.' },
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
  const note = requireDefined(noteText[String(annotation.id)]);
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
        Prick the base, line it with <span id={`${prefix}-beans`}>paper and beans</span>, and{' '}
        <span id={`${prefix}-blind`}>bake the shell blind</span> for 15 minutes.
      </p>
    </div>
  );
}

/**
 * A note inside an open shadow root whose target id is also used by a phrase outside it: the
 * layer anchors to its own phrase, and to nothing once that phrase goes.
 */
function ShadowReview() {
  const [hasPhrase, setPhrase] = useState(true);
  return (
    <>
      <p>
        Outside the shadow root: <span id="shadow-blind">bake the shell blind</span>.
      </p>
      <p>
        <Button size="sm" onPress={() => setPhrase(!hasPhrase)}>
          {hasPhrase ? 'Remove the phrase' : 'Restore the phrase'}
        </Button>
      </p>
      <ShadowRootApp demo="shadow-notes">
        <AnnotationLayer annotations={[{ id: 'blind', targetId: 'shadow-blind' }]}>
          <p>
            Prick the base and{' '}
            {hasPhrase ? <span id="shadow-blind">bake the shell blind</span> : 'bake it'} for 15
            minutes.
          </p>
          <AnnotationMargin aria-label="Shadow notes" renderCard={renderCard} />
        </AnnotationLayer>
      </ShadowRootApp>
    </>
  );
}

/** A review the reader works through: press a mark or a card, or move between cards by keyboard. */
function LiveReview() {
  const [currentKey, setCurrentKey] = useState<Key | null>(null);
  const [isLong, setLong] = useState(false);
  return (
    <div data-lab-demo="live">
      <p>
        <Button size="sm" onPress={() => setLong(!isLong)}>
          {isLong ? 'Remove the intro' : 'Add an intro'}
        </Button>{' '}
        Active: <output data-lab-active>{currentKey ?? 'none'}</output>
      </p>
      <AnnotationLayer
        annotations={createAnnotations('live')}
        currentKey={currentKey}
        onCurrentKeyChange={setCurrentKey}
      >
        <Method prefix="live" isLong={isLong} />
        <AnnotationMargin aria-label="Review notes" renderCard={renderCard} />
      </AnnotationLayer>
    </div>
  );
}

/** A review in the icons presentation: a marker per note, each opening its card below it. */
function IconsReview() {
  const [openKeys, setOpenKeys] = useState<Set<Key>>(new Set());
  return (
    <div data-lab-demo="icons">
      <p>
        Open: <output data-lab-open>{[...openKeys].join(', ') || 'none'}</output>
      </p>
      <AnnotationLayer
        annotations={[...createAnnotations('icons'), { id: 'beans', targetId: 'icons-beans' }]}
      >
        <Method prefix="icons" />
        <AnnotationMargin
          aria-label="Note markers"
          presentation="icons"
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          renderMarker={() => <ChatBubbleCheckGlyph />}
          renderCard={renderCard}
        />
      </AnnotationLayer>
    </div>
  );
}

/** Steps in a scrolling region, with a button of their own that adds a step above the note. */
function ScrollingSteps() {
  const [extra, setExtra] = useState(0);
  return (
    <div>
      <Button size="sm" onPress={() => setExtra(extra + 1)}>
        Add a step above
      </Button>
      <div
        role="region"
        aria-label="Steps"
        tabIndex={0}
        data-lab-scroller
        style={{ height: 180, overflow: 'auto' }}
      >
        {Array.from({ length: extra }, (_, index) => (
          <p key={index}>Added step {index + 1}: rinse the bowl.</p>
        ))}
        <p>Heat the oven to 190 degrees and grease the tin.</p>
        <p>Sift the flour with a pinch of salt.</p>
        <p>
          <span id="scroll-step">Fold in the whipped egg whites</span> with a metal spoon.
        </p>
        <p>Pour into the tin and level the top.</p>
        <p>Bake for 25 minutes, until the top springs back.</p>
        <p>Cool in the tin for 10 minutes before turning out.</p>
      </div>
    </div>
  );
}

/** A layer of fixed height, without a margin, whose content scrolls and changes on its own. */
function ScrollingReview() {
  const [currentKey, setCurrentKey] = useState<Key | null>(null);
  return (
    <div data-lab-demo="scrolling">
      <p>
        Active: <output data-lab-active>{currentKey ?? 'none'}</output>
      </p>
      <AnnotationLayer
        annotations={[{ id: 'fold', targetId: 'scroll-step' }]}
        currentKey={currentKey}
        onCurrentKeyChange={setCurrentKey}
      >
        <ScrollingSteps />
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
              defaultCurrentKey={active === 'none' ? null : active}
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
      title="Icons"
      description="The icons presentation draws a marker per note instead of its card; the two notes on one line stack. Activating a marker opens its card below it, several at once, and Escape inside a card closes it. Tab reaches the markers as one stop, moved with the arrow keys, Home and End."
    >
      <IconsReview />
    </LabSection>
    <LabSection
      title="Empty margin"
      description="A margin without annotations publishes data-empty; the reference styles hide it and give the content the full width."
    >
      <AnnotationLayer annotations={[]} data-lab-demo="empty">
        <p>No one has commented on this paragraph yet.</p>
        <AnnotationMargin presentation="icons" renderCard={renderCard} />
      </AnnotationLayer>
    </LabSection>
    <LabSection
      title="Scrolling and changing content"
      description="The steps scroll inside the layer, and their own button adds a step above the note without the layer rendering. The highlight and its underline stay inside the visible part of the phrase, even at the region’s edge, and disappear when it scrolls out. Pressing the phrase makes its note active."
    >
      <ScrollingReview />
    </LabSection>
    <LabSection
      title="Zoomed surface"
      description="The layer sits on a surface zoomed with a CSS scale, the same or different across and down. The highlight covers the phrase exactly, pressing the phrase up to its edges makes its note active, and the card stays level with it."
    >
      <ZoomedReview />
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
    <LabSection
      title="Inside a shadow root"
      description="A note inside an open shadow root, as a web component holds it, anchored to a phrase with the same id as one outside the root. The note anchors to its own phrase, and shows its anchor as removed once that phrase goes, never the phrase outside."
    >
      <ShadowReview />
    </LabSection>
  </>,
);
