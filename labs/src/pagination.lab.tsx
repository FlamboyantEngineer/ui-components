import { useState } from 'react';
import { Pagination } from '../../src/components/pagination/pagination.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const states = ['first page', 'middle page', 'last page', 'few pages', 'disabled'] as const;

const stateProps: Record<(typeof states)[number], { pageCount: number; page: number }> = {
  'first page': { pageCount: 12, page: 1 },
  'middle page': { pageCount: 12, page: 6 },
  'last page': { pageCount: 12, page: 12 },
  'few pages': { pageCount: 4, page: 2 },
  disabled: { pageCount: 12, page: 6 },
};

const cities = ['Lisbon', 'Oslo', 'Quito', 'Cairo', 'Porto', 'Seville', 'Napier', 'Izmir', 'Lima'];
const pageSize = 2;

function PagedList() {
  const [page, setPage] = useState(1);
  const shown = cities.slice((page - 1) * pageSize, page * pageSize);
  return (
    <div data-lab="paged">
      <ul data-lab-output>
        {shown.map((city) => (
          <li key={city}>{city}</li>
        ))}
      </ul>
      <Pagination
        aria-label="City pages"
        pageCount={Math.ceil(cities.length / pageSize)}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Gaps stand for skipped pages; previous and next stay focusable at either end."
    >
      <StateMatrix
        axes={{ state: states }}
        render={({ state }) => (
          <Pagination
            aria-label={`Pages, ${state}`}
            pageCount={stateProps[state].pageCount}
            defaultPage={stateProps[state].page}
            isDisabled={state === 'disabled'}
          />
        )}
      />
    </LabSection>
    <LabSection title="Paging a list" description="Nine cities, two per page.">
      <PagedList />
    </LabSection>
  </>,
);
