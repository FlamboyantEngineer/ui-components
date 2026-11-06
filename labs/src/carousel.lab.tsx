import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Carousel, type CarouselPagination } from '../../src/components/carousel/carousel.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

interface City {
  name: string;
  caption: string;
  ground: string;
  figure: string;
  /** A tall picture, which the frame fits whole. */
  portrait?: boolean;
}

const cities: readonly City[] = [
  {
    name: 'Lisbon',
    caption: 'Tiled façades above the river.',
    ground: '#0e7490',
    figure: '#ecfeff',
  },
  {
    name: 'Oslo',
    caption:
      'A fjord in the long evening light, with ferries crossing between the islands and the hills behind the harbour turning gold.',
    ground: '#1e3a8a',
    figure: '#dbeafe',
  },
  {
    name: 'Kyoto',
    caption: 'Maple leaves along a temple path.',
    ground: '#9a3412',
    figure: '#fff7ed',
    portrait: true,
  },
  { name: 'Quito', caption: 'Rooftops under the volcano.', ground: '#3f6212', figure: '#f7fee7' },
];

function picture(city: City): string {
  const svg = city.portrait
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 160"><rect width="90" height="160" fill="${city.ground}"/><circle cx="62" cy="34" r="12" fill="${city.figure}"/><path d="M0 160 L30 90 L55 130 L90 80 L90 160 Z" fill="${city.figure}" opacity="0.7"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><rect width="160" height="90" fill="${city.ground}"/><circle cx="120" cy="30" r="14" fill="${city.figure}"/><path d="M0 90 L50 40 L90 75 L120 55 L160 90 Z" fill="${city.figure}" opacity="0.7"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function citySlides(list: readonly City[] = cities) {
  return list.map((city) => (
    <figure key={city.name}>
      <img
        src={picture(city)}
        alt={`${city.name} skyline`}
        width={city.portrait ? 180 : 320}
        height={city.portrait ? 320 : 180}
      />
      <figcaption>
        <strong>{city.name}</strong> — {city.caption}{' '}
        <a href={`#${city.name.toLowerCase()}`}>More</a>
      </figcaption>
    </figure>
  ));
}

function thumbnail(index: number) {
  const city = cities[index];
  return city ? <img src={picture(city)} alt="" width={48} height={27} /> : null;
}

function Controlled() {
  const [index, setIndex] = useState(2);
  return (
    <div>
      <Carousel
        aria-label="Controlled cities"
        index={index}
        onIndexChange={setIndex}
        loop
        data-lab-carousel="controlled"
      >
        {citySlides()}
      </Carousel>
      <p>
        Shown: <output data-lab-output="index">{cities[index]?.name}</output>
      </p>
    </div>
  );
}

/**
 * The page moves or removes the shown city one second after a button press, time enough to put
 * focus back inside the slide: focus follows to the slide shown next.
 */
function HostChanges() {
  const [list, setList] = useState(cities);
  const [index, setIndex] = useState(0);
  const later = (change: () => void) => window.setTimeout(change, 1000);
  return (
    <div data-lab-demo="host-changes">
      <Carousel aria-label="Cities the page changes" index={index} onIndexChange={setIndex}>
        {citySlides(list)}
      </Carousel>
      <p>
        <button type="button" onClick={() => later(() => setIndex((at) => (at + 1) % list.length))}>
          Show the next city in one second
        </button>{' '}
        <button
          type="button"
          onClick={() => later(() => setList((all) => all.filter((_, at) => at !== index)))}
        >
          Remove the shown city in one second
        </button>
      </p>
    </div>
  );
}

/**
 * An uncontrolled carousel that starts at a chosen slide. Changing the start, or Start over,
 * remounts it; from then on it owns its index and reports each move.
 */
function StartingSlide() {
  const [start, setStart] = useState(2);
  const [mount, setMount] = useState(0);
  const [moves, setMoves] = useState<string[]>([]);
  const remount = () => {
    setMoves([]);
    setMount((count) => count + 1);
  };
  return (
    <div data-lab-demo="default-index">
      <SegmentedChoice
        aria-label="Start at"
        size="sm"
        sizing="content"
        options={cities.map((city, at) => ({ value: String(at), label: city.name }))}
        value={String(start)}
        onChange={(value) => {
          setStart(Number(value));
          remount();
        }}
      />{' '}
      <Button size="sm" variant="secondary" onPress={remount}>
        Start over
      </Button>
      <Carousel
        key={`${start}-${mount}`}
        aria-label="Cities from a chosen start"
        defaultIndex={start}
        onIndexChange={(at) => setMoves((all) => [...all, cities[at]?.name ?? String(at)])}
      >
        {citySlides()}
      </Carousel>
      <p>
        Moves since the start: <output data-lab-output="moves">{moves.join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

const cards = ['Alder', 'Birch', 'Cedar', 'Elm', 'Fir', 'Hazel', 'Larch'];

/** A row of cards, three a page and two a move; the output follows the first shown card. */
function CardRow() {
  const [index, setIndex] = useState(0);
  const [perPage, setPerPage] = useState('3');
  return (
    <div>
      <SegmentedChoice
        aria-label="Cards a page"
        size="sm"
        sizing="content"
        options={[
          { value: '1', label: 'One a page' },
          { value: '3', label: 'Three a page' },
        ]}
        value={perPage}
        onChange={(value) => setPerPage(value ?? '3')}
      />
      <Carousel
        aria-label="Trees"
        slidesPerPage={Number(perPage)}
        slidesPerMove={perPage === '3' ? 2 : 1}
        index={index}
        onIndexChange={setIndex}
        allowsSwiping
        data-lab-carousel="cards"
      >
        {cards.map((card) => (
          <article key={card}>
            <h3>{card}</h3>
            <p>
              A card about the {card.toLowerCase()} tree.{' '}
              <a href={`#${card.toLowerCase()}`}>Open</a>
            </p>
          </article>
        ))}
      </Carousel>
      <p>
        First shown card: <output data-lab-output="first-card">{cards[index]}</output>
      </p>
    </div>
  );
}

/** Each slide counts how often it mounted, and keeps a typed note while visited. */
function MountedNote({ name, onMount }: { name: string; onMount: (name: string) => void }) {
  const [note, setNote] = useState('');
  useEffect(() => onMount(name), [name, onMount]);
  return (
    <p>
      <label>
        Note about {name} <input value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
    </p>
  );
}

function DeferredSlides() {
  const [mounted, setMounted] = useState<string[]>([]);
  const onMount = useCallback((name: string) => setMounted((list) => [...list, name]), []);
  return (
    <div>
      <Carousel aria-label="Notes" mountSlides="visited" data-lab-carousel="deferred">
        {cities.map((city) => (
          <MountedNote key={city.name} name={city.name} onMount={onMount} />
        ))}
      </Carousel>
      <p>
        Mounted: <output data-lab-output="mounted">{mounted.join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Pagination"
      description="Dots, thumbnails or no pagination, with and without looping at the ends. The pages differ, a tall picture and a long caption among them, yet every page takes the same size, so the controls and pagination stay put."
    >
      <StateMatrix
        axes={{
          loop: ['no loop', 'loop'],
          pagination: ['dots', 'thumbnails', 'none'] as readonly CarouselPagination[],
        }}
        render={({ loop, pagination }) => (
          <Carousel
            aria-label={`Cities, ${pagination}, ${loop}`}
            pagination={pagination}
            loop={loop === 'loop'}
            renderThumbnail={thumbnail}
          >
            {citySlides()}
          </Carousel>
        )}
      />
    </LabSection>
    <LabSection
      title="Keyboard and controlled index"
      description="Tab into the carousel and press the arrow keys; focus inside a slide moves to the slide shown next. The output follows the controlled index."
    >
      <Controlled />
    </LabSection>
    <LabSection
      title="Starting at a chosen slide"
      description="An uncontrolled carousel with defaultIndex: pick where it starts, or Start over to remount it there, and compare it with the carousels above that start at the first slide. Afterwards it owns its index; each move is listed."
    >
      <StartingSlide />
    </LabSection>
    <LabSection
      title="Changed by the page"
      description="Press a button, then move focus into the shown slide (its More link) within a second: when the page shows the next city or removes the shown one, focus moves to the slide shown next instead of being lost."
    >
      <HostChanges />
    </LabSection>
    <LabSection
      title="Autoplay"
      description="Advances every three seconds, pausing while the pointer rests on it or focus is inside it. The first button stops rotation; it stays stopped while the reader prefers reduced motion, following a change to that setting until the button is used."
    >
      <Carousel aria-label="Rotating cities" autoplay interval={3000} data-lab-carousel="autoplay">
        {citySlides()}
      </Carousel>
    </LabSection>
    <LabSection
      title="Several cards a page"
      description="Three cards a page, two a move: the last page ends on the last card, so it overlaps the one before. Dots pick a page, and a swipe across the cards (touch, pen or mouse) moves one page; switch to one a page and the shown cards keep their place."
    >
      <CardRow />
    </LabSection>
    <LabSection
      title="Mounting slides when shown"
      description="With mountSlides=visited a slide renders once it is first shown, then keeps its state: type a note, move on and back, and the note is still there. The output lists each mount."
    >
      <DeferredSlides />
    </LabSection>
    <LabSection title="A single slide" description="No controls, pagination or rotation.">
      <Carousel aria-label="One city" autoplay data-lab-carousel="single">
        {citySlides(cities.slice(0, 1))}
      </Carousel>
    </LabSection>
  </>,
);
