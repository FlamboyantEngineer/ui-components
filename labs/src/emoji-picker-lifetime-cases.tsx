import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  EmojiPicker,
  EmojiPickerTrigger,
  type EmojiSelection,
} from '../../src/components/emoji-picker/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** A trigger the page disables after a delay, so it can lock while its picker is open. */
function LockingTrigger() {
  const [isDisabled, setDisabled] = useState(false);
  const [isScheduled, setScheduled] = useState(false);
  const [chosen, setChosen] = useState('none');
  const disableLater = () => {
    setScheduled(true);
    window.setTimeout(() => {
      setDisabled(true);
      setScheduled(false);
    }, 2000);
  };
  return (
    <div data-lab-demo="locking-trigger">
      <EmojiPickerTrigger
        isDisabled={isDisabled}
        onSelect={(selection: EmojiSelection) =>
          setChosen(
            selection.kind === 'native' ? selection.unicode : `:${selection.emoji.shortcode}:`,
          )
        }
      >
        <Button size="sm" isDisabled={isDisabled}>
          React
        </Button>
      </EmojiPickerTrigger>{' '}
      <Button size="sm" variant="secondary" isDisabled={isScheduled} onPress={disableLater}>
        Disable in 2 seconds
      </Button>{' '}
      <Button size="sm" variant="secondary" onPress={() => setDisabled(false)}>
        Enable
      </Button>
      <LabOutput name="trigger">{isDisabled ? 'disabled' : 'enabled'}</LabOutput>
      <LabOutput name="chosen">{chosen}</LabOutput>
    </div>
  );
}

const focusChoices = ['on', 'off'] as const;

/** An inline and a popup picker with autoFocus on or off, mounted when the reader asks. */
function FocusOnMount() {
  const [focus, setFocus] = useState<(typeof focusChoices)[number]>('on');
  const [mount, setMount] = useState(0);
  const autoFocus = focus === 'on';
  return (
    <div data-lab-demo="emoji-autofocus">
      <SegmentedChoice
        aria-label="autoFocus"
        size="sm"
        sizing="content"
        options={focusChoices.map((value) => ({ value, label: value }))}
        value={focus}
        onChange={(value) => {
          const match = focusChoices.find((option) => option === value);
          if (match) setFocus(match);
        }}
      />{' '}
      <Button size="sm" onPress={() => setMount((count) => count + 1)}>
        Mount the inline picker
      </Button>{' '}
      <EmojiPickerTrigger autoFocus={autoFocus} aria-label="Popup emoji picker">
        <Button size="sm" variant="secondary">
          Open the popup picker
        </Button>
      </EmojiPickerTrigger>
      {mount > 0 ? (
        <EmojiPicker
          key={`${String(mount)}-${focus}`}
          autoFocus={autoFocus}
          aria-label="Inline emoji picker"
        />
      ) : null}
    </div>
  );
}

export function EmojiPickerLifetimeCases() {
  return (
    <div data-lab-family="emoji-picker-lifetime-cases">
      <LabSection
        title="Disabled while open"
        description="Open the picker, then let Disable in 2 seconds lock the trigger: the picker closes. Enable leaves it closed until the reader opens it again."
      >
        <LockingTrigger />
      </LabSection>
      <LabSection
        title="Focus on mount"
        description="autoFocus puts focus in the search field as a picker mounts. A popup picker focuses by default; set it off and focus lands on the picker's box instead. An inline picker takes focus on its own box without it, and in its search field with it; Mount the inline picker mounts it afresh."
      >
        <FocusOnMount />
      </LabSection>
    </div>
  );
}
