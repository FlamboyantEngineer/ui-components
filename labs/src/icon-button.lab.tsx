import type { ButtonVariant } from '../../src/components/button/button.js';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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

mountLab(
  <>
    <LabSection title="Variants and sizes">
      <StateMatrix
        axes={{ variant: variants, size: sizes }}
        render={({ variant, size }) => (
          <IconButton icon="more" label="More actions" variant={variant} size={size} />
        )}
      />
    </LabSection>
    <LabSection title="States">
      <StateMatrix
        axes={{ variant: variants, state: states }}
        render={({ variant, state }) => (
          <IconButton
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
      title="Hint and shortcut"
      description="Without a hint, the tooltip names the command before its shortcut, since the button shows no text."
    >
      <StateMatrix
        axes={{ hint: ['shortcut', 'tooltip and shortcut'], size: sizes }}
        render={({ hint, size }) => (
          <IconButton
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
      title="Tooltip as the name"
      description="A tooltip that repeats the label names the button, so it is announced once; a longer tooltip describes it."
    >
      <div data-lab-demo="tooltip-name">
        <IconButton icon="edit" label="Rename" tooltip="Rename" />{' '}
        <IconButton icon="delete" label="Delete" tooltip="Delete the selected rows" />
      </div>
    </LabSection>
    <LabSection title="Toggles and links">
      <div data-lab-demo="toggle-link">
        <IconButton
          icon="eye"
          label="Show hidden files"
          tooltip="Show hidden files"
          defaultSelected={false}
        />{' '}
        <IconButton icon="help" label="Open help" tooltip="Open help" href="#help" />
      </div>
    </LabSection>
  </>,
);
