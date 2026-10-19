import { useState } from 'react';
import { Carousel, type CarouselPagination } from '../../src/components/carousel/carousel.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

interface City {
  name: string;
  caption: string;
  ground: string;
  figure: string;
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
    caption: 'A fjord in the long evening light.',
    ground: '#1e3a8a',
    figure: '#dbeafe',
  },
  {
    name: 'Kyoto',
    caption: 'Maple leaves along a temple path.',
    ground: '#9a3412',
    figure: '#fff7ed',
  },
  { name: 'Quito', caption: 'Rooftops under the volcano.', ground: '#3f6212', figure: '#f7fee7' },
];

function picture(city: City): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><rect width="160" height="90" fill="${city.ground}"/><circle cx="120" cy="30" r="14" fill="${city.figure}"/><path d="M0 90 L50 40 L90 75 L120 55 L160 90 Z" fill="${city.figure}" opacity="0.7"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function citySlides(list: readonly City[] = cities) {
  return list.map((city) => (
    <figure key={city.name}>
      <img src={picture(city)} alt={`${city.name} skyline`} width={320} height={180} />
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

mountLab(
  <>
    <LabSection
      title="Pagination"
      description="Dots, thumbnails or no pagination, with and without looping at the ends."
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
      title="Autoplay"
      description="Advances every three seconds, pausing while the pointer rests on it or focus is inside it. The first button stops rotation; a reader who prefers reduced motion starts stopped."
    >
      <Carousel aria-label="Rotating cities" autoplay interval={3000} data-lab-carousel="autoplay">
        {citySlides()}
      </Carousel>
    </LabSection>
    <LabSection title="A single slide" description="No controls, pagination or rotation.">
      <Carousel aria-label="One city" autoplay data-lab-carousel="single">
        {citySlides(cities.slice(0, 1))}
      </Carousel>
    </LabSection>
  </>,
);
