import { type ReactNode, useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  type NavigationMenuProps,
} from '../../src/components/navigation-menu/index.js';
import type { Key } from '../../src/core/props.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

interface SiteMenuProps extends Partial<NavigationMenuProps> {
  route?: string;
  labels?: { fruit: string; guides: string; about: string };
}

const english = { fruit: 'Fruit', guides: 'Guides', about: 'About' };

/** A panel column: a short title, a sentence and its links. */
function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', alignContent: 'start', gap: 6, minWidth: 160 }}>
      <strong>{title}</strong>
      {children}
    </div>
  );
}

/** The sample site menu: a home link, two items with panels, a disabled item and an outside link. */
function SiteMenu({ route = '/', labels = english, ...rest }: SiteMenuProps) {
  const link = (href: string, text: string) => (
    <NavigationMenuLink href={href} isCurrent={route === href}>
      {text}
    </NavigationMenuLink>
  );
  return (
    <NavigationMenu aria-label="Site" {...rest}>
      {link('/', 'Home')}
      <NavigationMenuItem id="fruit" label={labels.fruit}>
        <Column title="Orchard">
          <p>Seasonal picks, grown and packed on site.</p>
          {link('/fruit/apples', 'Apples')}
          {link('/fruit/pears', 'Pears')}
          {link('/fruit/plums', 'Plums')}
        </Column>
        <Column title="Boxes">
          {link('/boxes/weekly', 'Weekly box')}
          {link('/boxes/gift', 'Gift box')}
        </Column>
      </NavigationMenuItem>
      <NavigationMenuItem id="guides" label={labels.guides}>
        <Column title="Care">
          {link('/guides/pruning', 'Pruning')}
          {link('/guides/storage', 'Storage')}
        </Column>
      </NavigationMenuItem>
      <NavigationMenuItem id="archive" label="Archive" isDisabled>
        {link('/archive', 'Old notes')}
      </NavigationMenuItem>
      <NavigationMenuLink href="https://example.com/" isExternal>
        {labels.about}
      </NavigationMenuLink>
    </NavigationMenu>
  );
}

/** The menu over an in-page router, with the route and the open item read back. */
function RoutedMenu() {
  const [route, setRoute] = useState('/');
  const [openKey, setOpenKey] = useState<Key | null>(null);
  return (
    <UiProvider navigate={setRoute} useHref={(href) => `#${href}`}>
      <div data-lab-demo="site">
        <SiteMenu route={route} openKey={openKey} onOpenKeyChange={setOpenKey} />
        <LabOutput name="route">{route}</LabOutput>
        <LabOutput name="open">{openKey === null ? 'none' : String(openKey)}</LabOutput>
      </div>
    </UiProvider>
  );
}

mountLab(
  <>
    <LabSection
      title="Site navigation"
      description="Hover an item to open its panel; move into the panel without it closing. A press pins a panel, Escape closes it and returns focus, and a press on a link navigates and closes it. Home is the current page."
    >
      <RoutedMenu />
    </LabSection>
    <LabSection
      title="Press only"
      description="With openOnHover off, panels open and close by press, Enter or Space only, as on touch."
    >
      <div data-lab-demo="press">
        <SiteMenu aria-label="Site, press only" openOnHover={false} />
      </div>
    </LabSection>
    <LabSection
      title="Narrow layout"
      description="The same menu in a column, as a host might lay it out on a narrow screen; panels open in the flow."
    >
      <div data-lab-demo="narrow" style={{ maxWidth: 280 }}>
        <SiteMenu aria-label="Site, narrow" openOnHover={false} />
      </div>
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left page the list and panels follow the reading direction."
    >
      <UiProvider locale="he-IL">
        <div dir="rtl" data-lab-demo="rtl">
          <SiteMenu
            aria-label="Site, right to left"
            labels={{ fruit: 'פירות', guides: 'מדריכים', about: 'אודות' }}
          />
        </div>
      </UiProvider>
    </LabSection>
  </>,
);
