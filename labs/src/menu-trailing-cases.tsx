import { useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Menu, type MenuEntry } from '../../src/components/menu/menu.js';
import { BellGlyph, PlusGlyph } from '../../src/core/glyphs.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** A count badge for a row's trailing edge, read with its caller-provided label. */
function unread(count: number) {
  return <Badge count={count} max={9} tone="info" aria-label={`${count} unread`} />;
}

/** Plain and badged rows mixed: counts 0, 7 and 9+, a long label, a disabled row and a submenu. */
const trailingEntries: MenuEntry[] = [
  { id: 'inbox', label: 'Inbox', icon: BellGlyph, trailing: unread(7) },
  { id: 'mentions', label: 'Mentions', trailing: unread(0) },
  { id: 'updates', label: 'Updates', shortcut: 'Ctrl+U', trailing: unread(12) },
  { id: 'profile', label: 'Profile' },
  {
    id: 'digest',
    label: 'Weekly digest of every shared folder you follow',
    trailing: unread(3),
  },
  { id: 'archived', label: 'Archived', isDisabled: true, trailing: unread(4) },
  {
    id: 'teams',
    label: 'Teams',
    icon: PlusGlyph,
    trailing: unread(2),
    items: [
      { id: 'north', label: 'North', trailing: unread(1) },
      { id: 'south', label: 'South' },
    ],
  },
];

const widths = { wide: 320, narrow: 200 } as const;

function TrailingMenu({
  direction,
  width,
}: {
  direction: 'ltr' | 'rtl';
  width: keyof typeof widths;
}) {
  const [last, setLast] = useState('none');
  const menu = (
    <div
      dir={direction}
      style={{ width: widths[width] }}
      data-lab-demo={`trailing-${direction}-${width}`}
    >
      <Menu
        aria-label={`Notifications, ${direction}, ${width}`}
        items={trailingEntries}
        onAction={(key) => setLast(String(key))}
      />
      <LabOutput name={`trailing-${direction}-${width}`}>{last}</LabOutput>
    </div>
  );
  return direction === 'rtl' ? <UiProvider locale="ar-EG">{menu}</UiProvider> : menu;
}

/** Count badges at the trailing edge of menu rows (`trailing`). */
export function MenuTrailingSection() {
  return (
    <LabSection
      title="Trailing badges"
      description="trailing draws a count badge at each row's trailing edge, after the shortcut and before the submenu arrow, centred on the label: 0, 7 and 9+ counts, a wrapped long label, a disabled row and plain rows, in both reading directions and a narrow menu. Each badge's unread label joins its row's name; typing a letter still finds rows by their label."
    >
      <StateMatrix
        axes={{ direction: ['ltr', 'rtl'], width: ['wide', 'narrow'] }}
        render={({ direction, width }) => <TrailingMenu direction={direction} width={width} />}
      />
    </LabSection>
  );
}
