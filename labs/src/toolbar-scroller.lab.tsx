import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { IconButton } from '../../src/components/icon-button/icon-button.js';
import { ToolbarScroller } from '../../src/components/toolbar-scroller/toolbar-scroller.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const fewTools = ['Bold', 'Italic'];
const manyTools = ['Bold', 'Italic', 'Underline', 'Strike', 'Highlight', 'Link', 'Quote', 'Code'];

function Tools({ names }: { names: string[] }) {
  return (
    <>
      {names.map((name) => (
        <Button key={name} variant="ghost" size="sm">
          {name}
        </Button>
      ))}
      <IconButton icon="more" label="More tools" size="sm" />
    </>
  );
}

/** Scrolls the strip inside it once mounted, to show the start and end edges. */
function Scrolled({ to, children }: { to: 'start' | 'middle' | 'end'; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const strip = ref.current?.querySelector<HTMLElement>('.ui-toolbar-scroller__strip');
    if (!strip) return undefined;
    const scroll = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      const rtl = getComputedStyle(strip).direction === 'rtl';
      const offset = to === 'start' ? 0 : to === 'end' ? max : max / 2;
      strip.scrollLeft = rtl ? -offset : offset;
    };
    scroll();
    // The stylesheet can load after the lab mounts; scroll again once it lays the strip out.
    const observer = new ResizeObserver(scroll);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [to]);
  return (
    <div ref={ref} style={{ width: 260 }}>
      {children}
    </div>
  );
}

const positions = ['fits', 'start', 'middle', 'end'] as const;

mountLab(
  <>
    <LabSection
      title="Overflow by position"
      description="Each toolbar sits in a 260px column. Fades and scroll buttons appear only at an edge that hides tools."
    >
      <StateMatrix
        axes={{ direction: ['ltr', 'rtl'], buttons: ['on', 'off'], position: positions }}
        render={({ direction, buttons, position }) => (
          <UiProvider locale={direction === 'rtl' ? 'ar-EG' : 'en-US'}>
            <div dir={direction}>
              <Scrolled to={position === 'fits' ? 'start' : position}>
                <ToolbarScroller
                  aria-label={`Formatting ${direction} ${buttons} ${position}`}
                  scrollButtons={buttons === 'on'}
                >
                  <Tools names={position === 'fits' ? fewTools : manyTools} />
                </ToolbarScroller>
              </Scrolled>
            </div>
          </UiProvider>
        )}
      />
    </LabSection>
    <LabSection
      title="Keyboard and wheel"
      description="Tab into the toolbar, then use the arrow keys: the focused tool scrolls clear of the buttons and fades. A vertical wheel over the strip scrolls it sideways."
    >
      <div style={{ width: 320 }} data-lab-case="keyboard">
        <ToolbarScroller aria-label="Document tools">
          <Tools names={[...manyTools, 'Subscript', 'Superscript', 'Clear']} />
        </ToolbarScroller>
      </div>
    </LabSection>
  </>,
);
