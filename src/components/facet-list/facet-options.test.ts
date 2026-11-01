import { describe, expect, it } from 'vitest';
import { listFacetOptions, type FacetListOption } from './facet-options.js';

const options: FacetListOption[] = ['Lisbon', 'Oslo', 'Lima', 'Hanoi', 'Cork', 'Perth'].map(
  (label) => ({ value: label.toLowerCase(), label }),
);

const labels = (result: ReturnType<typeof listFacetOptions>) =>
  result.shown.map((option) => option.label);

describe('listFacetOptions', () => {
  const base = { options, query: '', firstValues: null, limit: 3, isExpanded: false };

  it('UIC-FACET-LIST-1.4 folds past the limit until expanded', () => {
    expect(labels(listFacetOptions(base))).toEqual(['Lisbon', 'Oslo', 'Lima']);
    expect(listFacetOptions(base).hiddenCount).toBe(3);
    expect(labels(listFacetOptions({ ...base, isExpanded: true }))).toHaveLength(6);
    expect(listFacetOptions({ ...base, limit: 10 }).hiddenCount).toBe(0);
  });

  it('UIC-FACET-LIST-1.3 shows every match of a query, ignoring case', () => {
    const result = listFacetOptions({ ...base, query: ' LI ' });
    expect(labels(result)).toEqual(['Lisbon', 'Lima']);
    expect(result.matchCount).toBe(2);
    expect(labels(listFacetOptions({ ...base, query: 'o' }))).toEqual([
      'Lisbon',
      'Oslo',
      'Hanoi',
      'Cork',
    ]);
    expect(listFacetOptions({ ...base, query: 'zz' }).matchCount).toBe(0);
  });

  it('UIC-FACET-LIST-1.3 matches values whatever their composition and case', () => {
    const spelled = [
      { value: 'quebec', label: 'Que\u0301bec' },
      { value: 'strasse', label: 'Hauptstraße' },
    ];
    const search = (query: string) =>
      labels(listFacetOptions({ ...base, options: spelled, query }));
    expect(search('QUÉBEC')).toEqual(['Que\u0301bec']);
    expect(search('STRAẞE')).toEqual(['Hauptstraße']);
  });

  it('UIC-FACET-LIST-1.5 lists the first values first, in option order', () => {
    expect(labels(listFacetOptions({ ...base, firstValues: ['perth', 'oslo'] }))).toEqual([
      'Oslo',
      'Perth',
      'Lisbon',
    ]);
  });
});
