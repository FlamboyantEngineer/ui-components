import { Button, type ButtonVariant } from '../../src/components/button/button.js';
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
          <Button variant={variant} size={size}>
            Save changes
          </Button>
        )}
      />
    </LabSection>
    <LabSection
      title="States"
      description="Hover, press and keyboard focus show on interaction; tab through the matrix to see focus."
    >
      <StateMatrix
        axes={{ variant: variants, state: states }}
        render={({ variant, state }) => (
          <Button
            variant={variant}
            startIcon="plus"
            isSelected={state === 'selected'}
            isDisabled={state === 'disabled' || state === 'focusable disabled'}
            focusableWhenDisabled={state === 'focusable disabled'}
            isPending={state === 'pending'}
          >
            Add item
          </Button>
        )}
      />
    </LabSection>
    <LabSection title="Icons">
      <StateMatrix
        axes={{ icons: ['start', 'end', 'both'], size: sizes }}
        render={({ icons, size }) => (
          <Button
            size={size}
            {...(icons !== 'end' ? { startIcon: 'plus' as const } : {})}
            {...(icons !== 'start' ? { endIcon: 'chevron-down' as const } : {})}
          >
            New
          </Button>
        )}
      />
    </LabSection>
    <LabSection title="Content and alignment" description="Each in a 220px column.">
      <StateMatrix
        axes={{ content: ['label', 'sentence', 'parts'], align: ['center', 'start'] }}
        render={({ content, align }) => (
          <div style={{ width: 220 }}>
            <Button
              content={content}
              align={align}
              fullWidth
              {...(content === 'parts' ? {} : { startIcon: 'info' as const })}
            >
              {content === 'parts' ? (
                <>
                  <span>Part one</span>
                  <span>Part two</span>
                </>
              ) : content === 'sentence' ? (
                'Summarise the selected rows into a short paragraph'
              ) : (
                'Details'
              )}
            </Button>
          </div>
        )}
      />
    </LabSection>
  </>,
);
