import { MoreGlyph, SaveGlyph } from '../../src/core/glyphs.js';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ToolbarScroller,
  type ToolbarScrollerItem,
} from '../../src/components/toolbar-scroller/toolbar-scroller.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const fewTools = ['Bold', 'Italic'];
const manyTools = ['Bold', 'Italic', 'Underline', 'Strike', 'Highlight', 'Link', 'Quote', 'Code'];

function TypedTools() {
  const [isReversed, setReversed] = useState(false);
  const items = [
    { id: 1, label: 'Numeric tool' },
    { id: '1', label: 'Text tool' },
  ];
  return (
    <div data-lab-demo="typed-tools">
      <Button onPress={() => setReversed(!isReversed)}>Reverse tools</Button>
      <ToolbarScroller
        aria-label="Separate tool drafts"
        items={isReversed ? [...items].reverse() : items}
        renderItem={(item) => <input aria-label={item.label} defaultValue={item.label} />}
      />
    </div>
  );
}

function Tools({ names }: { names: string[] }) {
  return (
    <>
      {names.map((name) => (
        <Button key={name} variant="ghost" size="sm">
          {name}
        </Button>
      ))}
      <Button icon={MoreGlyph} label="More tools" size="sm" />
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

/** Switching the overflow mode keeps the tools that stay visible, with their drafts and focus. */
function SwitchingMode() {
  const [overflow, setOverflow] = useState<'scroll' | 'menu'>('scroll');
  const tools = [
    { id: 'find', label: 'Find' },
    { id: 'replace', label: 'Replace' },
  ];
  return (
    <div style={{ width: 360 }} data-lab-demo="switching-mode">
      <Button onPress={() => setOverflow(overflow === 'scroll' ? 'menu' : 'scroll')}>
        Switch to {overflow === 'scroll' ? 'menu' : 'scroll'}
      </Button>
      <ToolbarScroller
        aria-label="Find and replace"
        overflow={overflow}
        items={tools}
        renderItem={(tool) => <input aria-label={tool.label} placeholder={tool.label} />}
      />
    </div>
  );
}

const positions = ['fits', 'start', 'middle', 'end'] as const;
const menuWidths = { wide: 640, medium: 360, narrow: 200 } as const;

function MenuTools({ width }: { width: keyof typeof menuWidths }) {
  const [last, setLast] = useState('none');
  const tools: ToolbarScrollerItem[] = [
    ...manyTools.map((name) => ({ id: name, label: name, onAction: () => setLast(name) })),
    { id: 'save', label: 'Save', icon: SaveGlyph, priority: 1, onAction: () => setLast('Save') },
  ];
  return (
    <div style={{ width: menuWidths[width] }} data-lab-menu={width}>
      <ToolbarScroller
        aria-label={`Editing, ${width}`}
        overflow="menu"
        items={tools}
        renderItem={(tool) => (
          <Button variant="ghost" size="sm" onPress={() => setLast(tool.label)}>
            {tool.label}
          </Button>
        )}
      />
      <p data-lab-output="last">Last tool: {last}</p>
    </div>
  );
}

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
    <LabSection
      title="Overflow menu"
      description="With overflow menu the tools that do not fit move into a menu at the end of the toolbar; Save has a higher priority and stays."
    >
      <StateMatrix
        axes={{ width: ['wide', 'medium', 'narrow'] }}
        render={({ width }) => <MenuTools width={width} />}
      />
    </LabSection>
    <LabSection
      title="Switching the overflow mode"
      description="Type a draft in Find, then switch between scroll and menu: the tools fit both ways, so they keep their drafts."
    >
      <SwitchingMode />
    </LabSection>
    <LabSection
      title="Numeric and text tool IDs"
      description="Edit a tool's draft, then reverse the tools: the draft stays with its original ID."
    >
      <TypedTools />
    </LabSection>
  </>,
);
