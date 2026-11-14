import { ListFilter } from '../../src/components/list-filter/list-filter.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
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
      description="The filters have icons, so where their labels do not fit the 220px row they fold to icons, named by their labels and shown in tooltips; trailing actions keep their room. Widen the row and the labels come back."
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
