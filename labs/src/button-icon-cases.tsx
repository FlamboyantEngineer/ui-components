import type { ButtonVariant } from '../../src/components/button/button.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const variants: ButtonVariant[] = [
  'primary',
  'secondary',
  'tertiary',
  'danger',
  'ghost',
  'accent',
  'chip',
  'link',
  'bare',
];
const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const states = ['default', 'selected', 'disabled', 'focusable disabled', 'pending'] as const;

export function ButtonIconCases() {
  return (
    <div data-lab-family="button-icon-cases">
      <>
        <LabSection title="Icon-only: Variants and sizes">
          <StateMatrix
            axes={{ variant: variants, size: sizes }}
            render={({ variant, size }) => (
              <Button icon="more" label="More actions" variant={variant} size={size} />
            )}
          />
        </LabSection>
        <LabSection title="Icon-only: States">
          <StateMatrix
            axes={{ variant: variants, state: states }}
            render={({ variant, state }) => (
              <Button
                icon="close"
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
            axes={{ hint: ['shortcut', 'tooltip and shortcut'], size: sizes }}
            render={({ hint, size }) => (
              <Button
                icon="undo"
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
            <Button icon="edit" label="Rename" tooltip="Rename" />{' '}
            <Button icon="delete" label="Delete" tooltip="Delete the selected rows" />
          </div>
        </LabSection>
        <LabSection title="Icon-only: Toggles and links">
          <div data-lab-demo="toggle-link">
            <Button
              icon="eye"
              label="Show hidden files"
              tooltip="Show hidden files"
              defaultSelected={false}
            />{' '}
            <Button icon="help" label="Open help" tooltip="Open help" href="#help" />
          </div>
        </LabSection>
      </>
    </div>
  );
}
