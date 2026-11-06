import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Image, type ImageLoadingStatus } from '../../src/components/image/index.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** A drawn landscape of the given size and label, as an SVG data URL. */
function scene(width: number, height: number, sky: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${sky}"/><path d="M0 ${height * 0.7} L${width * 0.35} ${height * 0.4} L${width * 0.6} ${height * 0.65} L${width} ${height * 0.45} V${height} H0 Z" fill="#14532d"/><text x="8" y="20" font-family="sans-serif" font-size="14" fill="#0f172a">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const lake = scene(160, 100, '#bae6fd', 'lake');
const backupLake = scene(160, 100, '#e2e8f0', 'backup');
const small = scene(160, 100, '#fde68a', '1x');
const large = scene(320, 200, '#fbcfe8', '2x');
/** Bytes that are no image, so the browser fails them without a network request. */
const broken = 'data:image/png;base64,bm90IGFuIGltYWdl';

const sources = {
  loads: { src: lake, alt: 'A lake under a pale sky' },
  backup: { src: broken, fallbackSrc: backupLake, alt: 'A lake under a grey sky' },
  fails: { src: broken, alt: 'A missing photo' },
  'fails, retry': { src: broken, alt: 'A missing chart', showRetry: true },
  decorative: { src: broken, alt: '' },
} as const;

/** What the lab draws in place of a failed image: decorative, as the fallback slot is named by alt. */
const fallback = <span>No image</span>;

function StatusReadout({ name }: { name: string }) {
  const [status, setStatus] = useState<ImageLoadingStatus | 'none'>('none');
  const [good, setGood] = useState(true);
  return (
    <div data-lab-demo={name}>
      <Image
        src={good ? lake : broken}
        alt="A lake under a pale sky"
        width={160}
        height={100}
        fallback={fallback}
        onLoadingStatusChange={setStatus}
      />
      <p>
        <Button size="sm" onPress={() => setGood(!good)}>
          {good ? 'Use a broken source' : 'Use a working source'}
        </Button>
      </p>
      <LabOutput name="status">{status}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Sources and fallbacks"
      description="An image that loads; one whose source fails and whose backup address loads; one that fails into its fallback, named by its alt text; one that also offers Reload image; and a decorative image, whose fallback is hidden from assistive technology. Each reserves a 160 by 100 box."
    >
      <StateMatrix
        axes={{ source: Object.keys(sources) as Array<keyof typeof sources> }}
        render={({ source }) => (
          <Image {...sources[source]} width={160} height={100} fallback={fallback} />
        )}
      />
    </LabSection>
    <LabSection
      title="Responsive candidates"
      description="srcSet offers a 1x and a 2x drawing, and sizes the slot it fills: the browser picks the candidate for the screen's pixel ratio."
    >
      <div data-lab-demo="responsive">
        <Image
          src={small}
          srcSet={`${small} 1x, ${large} 2x`}
          alt="Hills under a yellow sky"
          width={160}
          height={100}
        />
      </div>
    </LabSection>
    <LabSection
      title="Lazy loading with a placeholder"
      description="A lazily loaded image far down a scrolling box: the browser fetches it only as it nears the view. Until then its placeholder fills the reserved box."
    >
      <div
        data-lab-demo="lazy"
        tabIndex={0}
        role="region"
        aria-label="Scrolling gallery"
        style={{ height: 160, width: 220, overflow: 'auto' }}
      >
        <div style={{ height: 3200 }}>Scroll down to the photo.</div>
        <Image
          src="samples/landscape.svg"
          alt="A landscape far down the gallery"
          loading="lazy"
          width={160}
          height={100}
          placeholder={<span>Loading…</span>}
        />
      </div>
    </LabSection>
    <LabSection
      title="Changing the source"
      description="Switch between a broken and a working source: each new source starts loading afresh, so an earlier failure never carries over."
    >
      <StatusReadout name="switch" />
    </LabSection>
  </>,
);
