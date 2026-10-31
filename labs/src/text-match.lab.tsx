import { useCallback, useId, useMemo, useState } from 'react';
import { splitMatchTerms, textMatchesTerms } from '../../src/components/text-match/index.js';
import { TextMatch, TextMatchProvider } from '../../src/components/text-match/text-match.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sample = 'Go to the top of the Line-height list to add Favorites';
const queries = ['(none)', 'to', 'fav', 'line height', 'pear'] as const;
const dessertMenu = 'Café crème, crème brûlée and a café au lait';
const dessertQueries = ['cafe', 'café', 'creme brulee', 'lait creme cafe'] as const;
const compositions = {
  composed: 'Send your r\u00e9sum\u00e9 today',
  decomposed: 'Send your re\u0301sume\u0301 today',
} as const;
const cities = [
  'Lisbon',
  'Porto',
  'San Francisco',
  'Santa Fe',
  'Toronto',
  'Tokyo',
  'Stockholm',
  'Buenos Aires',
];

function FilterDemo() {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [matchWords, setMatchWords] = useState(false);
  const [shown, setShown] = useState<readonly string[]>([]);
  const registerText = useCallback((text: string) => {
    setShown((current) => [...current, text]);
    return () => setShown((current) => current.filter((entry) => entry !== text));
  }, []);
  const terms = useMemo(() => splitMatchTerms(query), [query]);
  const matching = cities.filter((city) => textMatchesTerms(city, terms)).length;
  return (
    <div data-lab-filter>
      <p>
        <label htmlFor={inputId}>Filter cities </label>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />{' '}
        <label>
          <input
            type="checkbox"
            checked={matchWords}
            onChange={(event) => setMatchWords(event.target.checked)}
          />{' '}
          Match words
        </label>
      </p>
      <TextMatchProvider query={query} matchWords={matchWords} registerText={registerText}>
        <ul>
          {cities.map((city) => (
            <li key={city}>
              <TextMatch>{city}</TextMatch>
            </li>
          ))}
        </ul>
      </TextMatchProvider>
      <p data-lab-filter-status>
        {matching} of {shown.length} labels contain every term
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Queries"
      description={`The text "${sample}" under each query, matching anywhere or by word.`}
    >
      <StateMatrix
        axes={{ query: queries, matching: ['substring', 'words'] }}
        render={({ query, matching }) => (
          <TextMatchProvider
            query={query === '(none)' ? '' : query}
            matchWords={matching === 'words'}
          >
            <TextMatch>{sample}</TextMatch>
          </TextMatchProvider>
        )}
      />
    </LabSection>
    <LabSection
      title="Accents and terms"
      description={`The text "${dessertMenu}". With ignoreAccents an unaccented query marks accented letters; each mark names its term in data-term, which the reference sheet tints per term.`}
    >
      <StateMatrix
        axes={{ query: dessertQueries, accents: ['exact', 'ignored'] }}
        render={({ query, accents }) => (
          <TextMatchProvider query={query} ignoreAccents={accents === 'ignored'}>
            <TextMatch>{dessertMenu}</TextMatch>
          </TextMatchProvider>
        )}
      />
    </LabSection>
    <LabSection
      title="Composed and decomposed accents"
      description="The same sentence with résumé written as composed letters or as letters followed by combining accents. Both match the same queries, and each mark covers whole letters with their accents."
    >
      <StateMatrix
        axes={{
          text: ['composed', 'decomposed'],
          query: ['resume', 'r\u00e9sum\u00e9'],
          accents: ['exact', 'ignored'],
        }}
        render={({ text, query, accents }) => (
          <TextMatchProvider query={query} ignoreAccents={accents === 'ignored'}>
            <TextMatch>{compositions[text as keyof typeof compositions]}</TextMatch>
          </TextMatchProvider>
        )}
      />
    </LabSection>
    <LabSection
      title="Filtering"
      description="Type a query. Every label marks it as you type, and the provider counts the labels that registered."
    >
      <FilterDemo />
    </LabSection>
  </>,
);
