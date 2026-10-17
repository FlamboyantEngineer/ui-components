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
  </>,
);
