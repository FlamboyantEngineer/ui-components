import { SearchGlyph, WarningGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import {
  EmptyState,
  type EmptyStateVariant,
} from '../../src/components/empty-state/empty-state.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const variants: EmptyStateVariant[] = ['empty', 'loading', 'error'];
const copy: Record<EmptyStateVariant, { title: string; description: string }> = {
  empty: { title: 'No cities yet', description: 'Add a city to see it here.' },
  loading: { title: 'Loading cities', description: 'Fetching the latest list…' },
  error: { title: 'Unable to load cities', description: 'Check your connection and try again.' },
};

function ReloadDemo() {
  const [phase, setPhase] = useState<'loading' | 'empty' | 'list'>('empty');
  return (
    <div data-lab-demo="reload">
      <p>
        <Button size="sm" data-lab-action="reload" onPress={() => setPhase('loading')}>
          Reload
        </Button>{' '}
        <Button
          size="sm"
          data-lab-action="finish"
          isDisabled={phase !== 'loading'}
          onPress={() => setPhase('list')}
        >
          Finish loading
        </Button>{' '}
        <Button size="sm" variant="tertiary" onPress={() => setPhase('empty')}>
          Clear
        </Button>
      </p>
      {phase === 'list' ? (
        <ul data-lab-output="list">
          <li>Lisbon</li>
          <li>Oslo</li>
          <li>Nairobi</li>
        </ul>
      ) : (
        <EmptyState
          headingLevel={2}
          variant={phase === 'loading' ? 'loading' : 'empty'}
          title={phase === 'loading' ? undefined : 'No cities'}
          description={phase === 'loading' ? 'Loading cities…' : 'Press Reload to fetch them.'}
        />
      )}
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants and sizes"
      description="Each variant with a heading, at the default and the small size."
    >
      <StateMatrix
        axes={{ variant: variants, size: ['md', 'sm'] }}
        render={({ variant, size }) => (
          <div style={{ width: 280 }}>
            <EmptyState
              variant={variant}
              size={size}
              title={copy[variant].title}
              description={copy[variant].description}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection title="Without a heading" description="The description alone, in each variant.">
      <StateMatrix
        axes={{ variant: variants, size: ['md', 'sm'] }}
        render={({ variant, size }) => (
          <div style={{ width: 280 }}>
            <EmptyState variant={variant} size={size} description={copy[variant].description} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Illustration and actions"
      description="A decorative glyph over the text and calls to action under it; loading draws its spinner in place of the glyph."
    >
      <StateMatrix
        axes={{ variant: variants, size: ['md', 'sm'] }}
        render={({ variant, size }) => (
          <div style={{ width: 280 }}>
            <EmptyState
              variant={variant}
              size={size}
              icon={variant === 'error' ? WarningGlyph : SearchGlyph}
              title={copy[variant].title}
              description={copy[variant].description}
              actions={
                variant === 'loading' ? null : (
                  <>
                    <Button size="sm" variant="primary">
                      {variant === 'error' ? 'Try again' : 'Add city'}
                    </Button>
                    <Button size="sm" variant="tertiary">
                      Learn more
                    </Button>
                  </>
                )
              }
            />
          </div>
        )}
        caption="With illustration and actions"
      />
    </LabSection>
    <LabSection
      title="Loading then content"
      description="Reload shows the loading notice in place of the list; Finish loading replaces the notice with the content."
    >
      <ReloadDemo />
    </LabSection>
  </>,
);
