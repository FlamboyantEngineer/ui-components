import { useState } from 'react';
import { Announcer, useAnnounce } from '../../src/components/announcer/announcer.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection, mountLab } from './chrome/index.js';

const initialFruit = ['Apples', 'Pears', 'Plums', 'Cherries'];

/** A list reordered with buttons; each move is announced politely, as nothing else says it. */
function Reorder() {
  const announce = useAnnounce();
  const [fruit, setFruit] = useState(initialFruit);
  const move = (index: number, offset: number) => {
    const target = index + offset;
    const name = fruit[index];
    if (name === undefined || target < 0 || target >= fruit.length) return;
    const next = fruit.filter((_, position) => position !== index);
    next.splice(target, 0, name);
    setFruit(next);
    announce(`${name} moved to position ${target + 1} of ${fruit.length}.`);
  };
  return (
    <ol aria-label="Basket">
      {fruit.map((name, index) => (
        <li key={name}>
          {name}{' '}
          <Button size="xs" variant="secondary" onPress={() => move(index, -1)}>
            Move {name} up
          </Button>{' '}
          <Button size="xs" variant="secondary" onPress={() => move(index, 1)}>
            Move {name} down
          </Button>
        </li>
      ))}
    </ol>
  );
}

/** An urgent announcement interrupts the reader. */
function Urgent() {
  const announce = useAnnounce();
  return (
    <Button
      size="sm"
      onPress={() =>
        announce('Connection lost. Changes are kept here.', { politeness: 'assertive' })
      }
    >
      Lose the connection
    </Button>
  );
}

/** Reads one announcer's regions back on screen, so the lab shows what a reader would hear. */
function RegionEcho({ scope }: { scope: string }) {
  const [text, setText] = useState({ polite: '', assertive: '' });
  return (
    <p data-lab-output={scope}>
      <Button
        size="xs"
        variant="ghost"
        onPress={() => {
          const root = document.querySelector(`[data-lab-announcer="${scope}"]`);
          setText({
            polite: root?.querySelector('.ui-announcer__polite')?.textContent ?? '',
            assertive: root?.querySelector('.ui-announcer__assertive')?.textContent ?? '',
          });
        }}
      >
        Show what {scope} holds
      </Button>{' '}
      Polite: “{text.polite}” Assertive: “{text.assertive}”
    </p>
  );
}

mountLab(
  <>
    <LabSection
      title="Polite and assertive"
      description="Moving an item is announced politely; losing the connection interrupts. Run a screen reader to hear them, or show what the regions hold."
    >
      <div data-lab-demo="page">
        <Announcer data-lab-announcer="page">
          <Reorder />
          <Urgent />
        </Announcer>
        <RegionEcho scope="page" />
      </div>
    </LabSection>
    <LabSection
      title="Scoped announcers"
      description="An inner announcer serves its own panel; the outer one serves the rest of the page."
    >
      <div data-lab-demo="scoped">
        <Announcer data-lab-announcer="outer">
          <Urgent />
          <Announcer data-lab-announcer="inner">
            <Reorder />
          </Announcer>
        </Announcer>
        <RegionEcho scope="outer" />
        <RegionEcho scope="inner" />
      </div>
    </LabSection>
  </>,
);
