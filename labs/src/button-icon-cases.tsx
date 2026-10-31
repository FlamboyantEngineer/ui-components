import {
  CloseGlyph,
  DeleteGlyph,
  EditGlyph,
  EyeGlyph,
  HelpGlyph,
  MoreGlyph,
  UndoGlyph,
} from '../../src/core/glyphs.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { buttonSizes, buttonStates, buttonVariants } from './button-axes.js';
import { LabSection, StateMatrix } from './chrome/index.js';

/** An icon that comes and goes with a condition: `false` or `null` leaves a labelled button. */
function ConditionalIcon() {
  const [isEditing, setEditing] = useState(true);
  return (
    <LabSection
      title="Conditional icon"
      description="icon={isEditing && EditGlyph}: while the condition holds the button is icon-only; when it is false the button shows its text, as with no icon at all."
    >
      <div data-lab-demo="conditional-icon">
        <Button icon={isEditing && EditGlyph} label="Edit" onPress={() => setEditing(!isEditing)}>
          Done
        </Button>{' '}
        <Button icon={null} href="#help">
          Help
        </Button>
      </div>
    </LabSection>
  );
}

export function ButtonIconCases() {
  return (
    <div data-lab-family="button-icon-cases">
      <>
        <LabSection title="Icon-only: Variants and sizes">
          <StateMatrix
            axes={{ variant: buttonVariants, size: buttonSizes }}
            render={({ variant, size }) => (
              <Button icon={MoreGlyph} label="More actions" variant={variant} size={size} />
            )}
          />
        </LabSection>
        <LabSection title="Icon-only: States">
          <StateMatrix
            axes={{ variant: buttonVariants, state: buttonStates }}
            render={({ variant, state }) => (
              <Button
                icon={CloseGlyph}
                label="Close"
                variant={variant}
                isSelected={state === 'selected'}
                isDisabled={state === 'disabled' || state === 'focusable disabled'}
                focusableWhenDisabled={state === 'focusable disabled'}
                isPending={state === 'pending'}
              />
            )}
          />
        </LabSection>
        <LabSection
          title="Icon-only: Hint and shortcut"
          description="Without a hint, the tooltip names the command before its shortcut, since the button shows no text."
        >
          <StateMatrix
            axes={{ hint: ['shortcut', 'tooltip and shortcut'], size: buttonSizes }}
            render={({ hint, size }) => (
              <Button
                icon={UndoGlyph}
                label="Undo"
                size={size}
                shortcut="Ctrl+Z"
                {...(hint === 'shortcut' ? {} : { tooltip: 'Undo the last edit' })}
              />
            )}
          />
        </LabSection>
        <LabSection
          title="Icon-only: Tooltip as the name"
          description="A tooltip that repeats the label names the button, so it is announced once; a longer tooltip describes it."
        >
          <div data-lab-demo="tooltip-name">
            <Button icon={EditGlyph} label="Rename" tooltip="Rename" />{' '}
            <Button icon={DeleteGlyph} label="Delete" tooltip="Delete the selected rows" />
          </div>
        </LabSection>
        <LabSection title="Icon-only: Toggles and links">
          <div data-lab-demo="toggle-link">
            <Button
              icon={EyeGlyph}
              label="Show hidden files"
              tooltip="Show hidden files"
              defaultSelected={false}
            />{' '}
            <Button icon={HelpGlyph} label="Open help" tooltip="Open help" href="#help" />
          </div>
        </LabSection>
        <ConditionalIcon />
      </>
    </div>
  );
}
