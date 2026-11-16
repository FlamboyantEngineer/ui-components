import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { CommentComposer } from '../../src/components/comment-composer/comment-composer.js';
import { CommentThread, CommentThreadReply } from '../../src/components/comment-thread/index.js';
import { CheckGlyph, CloseGlyph, LinkGlyph } from '../../src/core/glyphs.js';
import { LabSection } from './chrome/index.js';

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const lena = { name: 'Lena Ortiz', colorKey: 'lena' };
const time = '2026-04-20T09:40:00';
const copyLink = [{ id: 'copy-link', label: 'Copy link', icon: LinkGlyph }];

/** A compact composer: one row, its buttons only while focused or holding a draft. */
function compactComposer(onSubmit: (text: string) => void) {
  return <CommentComposer label="Reply" minRows={1} actionsOnFocus onSubmit={onSubmit} />;
}

/** A proposed change's discussion, before anyone replies: its author, Accept and Reject. */
function ChangeDiscussion({ onAction }: { onAction: (action: string) => void }) {
  return (
    <CommentThread
      quote="tasting samples"
      author={lena}
      time={time}
      headerActions={
        <>
          <Button
            size="sm"
            variant="ghost"
            icon={CheckGlyph}
            label="Accept"
            tooltip="Accept"
            onPress={() => onAction('accepted')}
          />
          <Button
            size="sm"
            variant="ghost"
            icon={CloseGlyph}
            label="Reject"
            tooltip="Reject"
            onPress={() => onAction('rejected')}
          />
        </>
      }
      menu={copyLink}
      onAction={(key) => onAction(String(key))}
      composer={compactComposer((text) => onAction(`replied "${text}"`))}
      data-lab-thread="change"
    />
  );
}

/** A discussion whose opening comment's menu and Reopen live in the header menu. */
function MenuThread({
  isSelected,
  onAction,
}: {
  isSelected: boolean;
  onAction: (action: string) => void;
}) {
  const [opening, setOpening] = useState('Ship the samples by Friday?');
  return (
    <CommentThread
      firstInMenu
      resolveInMenu
      composerOnSelect
      isSelected={isSelected}
      defaultResolved={false}
      onResolvedChange={(isResolved) => onAction(isResolved ? 'resolved' : 'reopened')}
      menu={copyLink}
      onAction={(key) => onAction(String(key))}
      confirmsDelete={false}
      composer={compactComposer((text) => onAction(`replied "${text}"`))}
      data-lab-thread="menu"
    >
      <CommentThreadReply
        author={maria}
        time={time}
        text={opening}
        onEdit={setOpening}
        onDelete={() => onAction('deleted the opening comment')}
      />
    </CommentThread>
  );
}

/** A thread being started, closed by its header button. */
function StartedThread({ onAction }: { onAction: (action: string) => void }) {
  return (
    <CommentThread
      quote="by Friday"
      onClose={() => onAction('closed the new thread')}
      composer={compactComposer((text) => onAction(`started "${text}"`))}
      data-lab-thread="started"
    />
  );
}

/** Header controls, the header menu, a close button and compact composers. */
export function CommentThreadHeaderCases() {
  const [lastAction, setLastAction] = useState('none');
  const [isSelected, setIsSelected] = useState(false);
  return (
    <LabSection
      title="Header controls and menu"
      description="A proposed change's discussion shows its author, Accept and Reject, and a More actions menu. The second thread moves its opening comment's Edit and Delete (no confirmation) into the More actions menu, shows Reopen there once resolved, and shows its composer only while selected. The third, being started, closes from its header. Each composer starts one row high and shows its buttons while focused or holding a draft."
    >
      <ChangeDiscussion onAction={setLastAction} />
      <Button size="sm" variant="secondary" onPress={() => setIsSelected((value) => !value)}>
        {isSelected ? 'Deselect' : 'Select'} the second thread
      </Button>
      <MenuThread isSelected={isSelected} onAction={setLastAction} />
      <StartedThread onAction={setLastAction} />
      <p>
        Last action: <output data-lab-output="header-action">{lastAction}</output>
      </p>
    </LabSection>
  );
}
