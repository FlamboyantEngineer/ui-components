import {
  CloseGlyph,
  DeleteGlyph,
  EditGlyph,
  EyeGlyph,
  HelpGlyph,
  MoreGlyph,
  UndoGlyph,
} from '../../src/core/glyphs.js';
import { Button } from '../../src/components/button/button.js';
import { buttonSizes, buttonStates, buttonVariants } from './button-axes.js';
import { LabSection, StateMatrix } from './chrome/index.js';

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
      </>
    </div>
  );
}
