import { useState } from 'react';
import { Pagination } from '../../src/components/pagination/pagination.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

const states = [
  'first page',
  'middle page',
  'last page',
  'few pages',
  'one page',
  'no results',
  'disabled',
  'fractional page',
  'unreadable page',
] as const;

const stateProps: Record<(typeof states)[number], { pageCount: number; page: number }> = {
  'first page': { pageCount: 12, page: 1 },
  'middle page': { pageCount: 12, page: 6 },
  'last page': { pageCount: 12, page: 12 },
  'few pages': { pageCount: 4, page: 2 },
  'one page': { pageCount: 1, page: 1 },
  'no results': { pageCount: 0, page: 1 },
  disabled: { pageCount: 12, page: 6 },
  'fractional page': { pageCount: 12, page: 4.8 },
  'unreadable page': { pageCount: 12, page: Number.NaN },
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

const counts = [12, 5, 1, 0] as const;

/** A host that changes the page count under a late page. */
function ChangingCount() {
  const [pageCount, setPageCount] = useState<number>(12);
  const [page, setPage] = useState(10);
  const [calls, setCalls] = useState<string[]>([]);
  return (
    <div data-lab-demo="changing-count">
      <SegmentedChoice
        aria-label="Page count"
        sizing="content"
        options={counts.map((count) => ({ value: String(count), label: String(count) }))}
        value={String(pageCount)}
        onChange={(value) => setPageCount(Number(value ?? 12))}
      />
      <Pagination
        aria-label="Results pages"
        pageCount={pageCount}
        page={page}
        onPageChange={(next) => {
          setPage(next);
          setCalls((current) => [...current, `onPageChange(${String(next)})`]);
        }}
      />
      <p>
        Host page: <output data-lab-output="page">{page}</output>, shown page:{' '}
        <output data-lab-output="shown">{Math.min(page, Math.max(1, pageCount))}</output>
      </p>
      <p>
        Callbacks: <output data-lab-output="calls">{calls.join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Gaps stand for skipped pages; previous and next stay focusable at either end. A fractional requested page rounds down; an unreadable page starts at one."
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
    <LabSection
      title="Changing page count"
      description="The host holds page 10. Drop the count to 5, 1 or 0: the pagination shows the nearest page without calling onPageChange, and the host's page comes back into range when the count is restored."
    >
      <ChangingCount />
    </LabSection>
    <LabSection
      title="Right to left with Arabic digits"
      description="Under an Arabic locale the page numbers use Arabic-Indic digits, the names are localized and the previous and next chevrons mirror."
    >
      <UiProvider locale="ar-EG">
        <div dir="rtl" data-lab-demo="rtl">
          <Pagination pageCount={12} defaultPage={6} />
        </div>
      </UiProvider>
    </LabSection>
  </>,
);
