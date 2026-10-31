import { useMemo, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  SelectField,
  type SelectFieldLoader,
} from '../../src/components/select-field/select-field.js';
import { LabOutput } from './lab-output.js';

type Place = 'town' | 'village';

const places = (place: Place) =>
  Array.from({ length: 60 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    const name = place === 'town' ? 'Town' : 'Village';
    return { id: `${place}-${number}`, label: `${name} ${number}` };
  });

const sources = { town: places('town'), village: places('village') };

/** Twenty places a page from one of two lists; the lab swaps the list the field searches. */
export function Paged() {
  const [place, setPlace] = useState<Place>('town');
  const [pages, setPages] = useState(0);
  const [request, setRequest] = useState('none');
  const loadOptions = useMemo<SelectFieldLoader>(
    () => async (query, _signal, cursor) => {
      setPages((count) => count + 1);
      setRequest(`${place}s: "${query}" from ${cursor ?? 'the start'}`);
      if (query === 'offline') throw new Error('The list is offline.');
      const matches = sources[place].filter((entry) =>
        entry.label.toLowerCase().includes(query.toLowerCase()),
      );
      const start = Number(cursor ?? 0);
      const end = start + 20;
      return {
        items: matches.slice(start, end),
        cursor: end < matches.length ? String(end) : undefined,
      };
    },
    [place],
  );
  const other = place === 'town' ? 'village' : 'town';
  return (
    <>
      <SelectField
        label="Place"
        options={[]}
        loadOptions={loadOptions}
        minSearchLength={0}
        searchDelay={0}
        description='Twenty places a page; scrolling to the end loads the next page. Searching "offline" fails, and the failed search offers no page of the search before it. Switching lists searches the new list from its first page.'
        data-lab-field="paged"
      />
      <Button size="sm" onPress={() => setPlace(other)}>
        {`Search ${other}s`}
      </Button>
      <LabOutput name="Pages">{pages}</LabOutput>
      <LabOutput name="Last request">{request}</LabOutput>
    </>
  );
}
