// Text Match case: a nested provider that inherits the outer search on request, without
// remounting the labels or the state beside them.

import { useCallback, useState } from 'react';
import { Switch } from '../../src/components/switch/switch.js';
import {
  TextMatch,
  TextMatchProvider,
  type TextMatchRegister,
} from '../../src/components/text-match/text-match.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const labels = ['Café crème', 'Café au lait', 'Cafeteria hours'];

/** A register callback that keeps the number of texts registered with it. */
function useRegisteredCount(): [number, TextMatchRegister] {
  const [count, setCount] = useState(0);
  const register = useCallback<TextMatchRegister>(() => {
    setCount((value) => value + 1);
    return () => setCount((value) => value - 1);
  }, []);
  return [count, register];
}

/** Labels beside a note whose draft shows the content was not remounted. */
function MenuLabels() {
  const [note, setNote] = useState('');
  return (
    <>
      <ul>
        {labels.map((label) => (
          <li key={label} data-lab-label={label}>
            <TextMatch>{label}</TextMatch>
          </li>
        ))}
      </ul>
      <label>
        Note <input value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
    </>
  );
}

function NestedProviders() {
  const [isInherited, setInherited] = useState(false);
  const [outerCount, registerOuter] = useRegisteredCount();
  const [innerCount, registerInner] = useRegisteredCount();
  return (
    <div data-lab-demo="nested-providers">
      <Switch isSelected={isInherited} onChange={setInherited}>
        Inherit the outer search
      </Switch>
      <p>Outer: “cafe”, any accent, inside words. Inner: “lait”, accents count, whole words.</p>
      <LabOutput name="outer registered">{outerCount}</LabOutput>
      <LabOutput name="inner registered">{innerCount}</LabOutput>
      <TextMatchProvider query="cafe" ignoreAccents registerText={registerOuter}>
        <TextMatchProvider
          query="lait"
          matchWords
          registerText={registerInner}
          isInherited={isInherited}
        >
          <MenuLabels />
        </TextMatchProvider>
      </TextMatchProvider>
    </div>
  );
}

export function TextMatchNestedCases() {
  return (
    <div data-lab-family="text-match-nested-cases">
      <LabSection
        title="Inheriting the outer search"
        description="An inner provider inside an outer one. Off, the labels mark the inner query with the inner options and register with the inner provider. On, isInherited passes the outer query, options and registration through, while the labels and the note's draft stay mounted; off again restores the inner ones."
      >
        <NestedProviders />
      </LabSection>
    </div>
  );
}
