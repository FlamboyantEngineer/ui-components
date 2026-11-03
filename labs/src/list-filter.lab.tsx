import { UiProvider } from '../../src/core/provider.js';
import { ListFilter } from '../../src/components/list-filter/list-filter.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { FilterDockExample, ListFilterExample } from './list-filter-examples.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;

mountLab(
  <>
    <LabSection title="Sizes and states">
      <StateMatrix
        axes={{ size: sizes, state: ['default', 'disabled', 'hidden zero'] }}
        render={({ size, state }) => (
          <ListFilter
            aria-label={`${size} ${state} filters`}
            options={[
              { value: 'unread', label: 'Unread', count: 7 },
              { value: 'all', label: 'All', count: 128, countMax: 100 },
              { value: 'mentions', label: 'Mentions', count: 0 },
            ]}
            value="unread"
            size={size}
            isDisabled={state === 'disabled'}
            showZero={state !== 'hidden zero'}
            countMax={9}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="List header"
      description="Try keyboard selection, changing counts, a rejected filter change and the independent actions."
    >
      <ListFilterExample label="Header" />
    </LabSection>
    <LabSection
      title="Narrow panel"
      description="Filters scroll within the row while trailing actions keep their room."
    >
      <div data-lab-demo="narrow-filter" style={{ width: 220, maxWidth: '100%' }}>
        <ListFilterExample label="Narrow" />
      </div>
    </LabSection>
    <LabSection title="Many actions">
      <div data-lab-demo="many-filter-actions" style={{ width: 220, maxWidth: '100%' }}>
        <ListFilter
          aria-label="Many actions filters"
          options={[{ value: 'all', label: 'All', count: 7 }]}
          value="all"
          actions={[
            { verb: 'add' },
            { verb: 'refresh' },
            { verb: 'edit' },
            { verb: 'delete' },
            { verb: 'save' },
          ]}
        />
      </div>
    </LabSection>
    <LabSection title="Right to left">
      <UiProvider locale="ar">
        <div dir="rtl">
          <ListFilterExample label="RTL" />
        </div>
      </UiProvider>
    </LabSection>
    <LabSection title="Docked lists">
      <FilterDockExample />
    </LabSection>
  </>,
);
