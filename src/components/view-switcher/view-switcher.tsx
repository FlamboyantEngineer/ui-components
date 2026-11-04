'use client';

import {
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { StarGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { TabListStateContext } from '../../primitives/index.js';
import { listTabbables } from '../../utils/tabbable.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import type { IconSource } from '../icon/icon.js';
import type { MenuEntry } from '../menu/menu.js';
import { Tab, TabList, Tabs } from '../tabs/tabs.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import {
  closedViewDialog,
  listViewActions,
  resolveViewDialog,
  type ViewActionContext,
  type ViewActionHandlers,
} from './view-actions.js';
import { type ViewDialog, type ViewDialogRequest, ViewDialogs } from './view-dialogs.js';

/** One saved view of a collection. */
export interface ViewSwitcherView {
  /** Identifies the view. */
  id: Key;
  /** The view's name. */
  label: string;
  /** A icon component or rendered element before the name, such as the view's layout. Decorative. */
  icon?: IconSource;
}

/** `tabs` lists the views as tabs; `menu` puts them in a menu, for many views or little room. */
export type ViewSwitcherVariant = 'tabs' | 'menu';

export interface ViewSwitcherProps
  extends RefProps<HTMLDivElement>, BaseProps, AriaLabellingProps, ViewActionHandlers {
  /** The saved views, in order. */
  views: readonly ViewSwitcherView[];
  /** The selected view's `id`, controlled. */
  selectedKey?: Key | undefined;
  /** The view selected at first, uncontrolled. Defaults to the default view, else the first. */
  defaultSelectedKey?: Key | undefined;
  /** Called with the view the reader selects. */
  onSelectionChange?: ((key: Key) => void) | undefined;
  /** The selected view's current settings differ from its saved ones. */
  isDirty?: boolean | undefined;
  /** The view that opens first, which is marked. */
  defaultViewKey?: Key | null | undefined;
  /** How the views show. Defaults to `tabs`. */
  variant?: ViewSwitcherVariant | undefined;
  /** The selected view's content: the tab panel of `tabs`, after the menu of `menu`. */
  children?: ReactNode;
}

const hooks = createHooks('view-switcher', [
  'bar',
  'tabs',
  'tab',
  'menu',
  'label',
  'default',
  'modified',
  'actions',
  'panel',
]);

/** A view's name with its marks: the default view's star and the modified mark. */
function ViewLabel({
  view,
  isDefault,
  isModified,
}: {
  view: ViewSwitcherView;
  isDefault: boolean;
  isModified: boolean;
}) {
  const strings = useUiStrings();
  // The spaces keep the parts apart in the accessible name; a row layout drops them.
  return (
    <>
      <span {...hooks.slot('label', { label: view.label })}>{view.label}</span>
      {isDefault ? (
        <>
          {' '}
          <span {...hooks.slot('default')}>
            <Glyph icon={StarGlyph} />
            <VisuallyHidden as="span">{strings.defaultView}</VisuallyHidden>
          </span>
        </>
      ) : null}
      {isModified ? (
        <>
          {' '}
          <span {...hooks.slot('modified')}>
            <VisuallyHidden as="span">{strings.viewModified}</VisuallyHidden>
          </span>
        </>
      ) : null}
    </>
  );
}

/** The views as tabs, each with a menu of its actions. */
function ViewTabs({
  props,
  selectedKey,
  onSelect,
  getActions,
  actions,
  panelRef,
}: {
  props: ViewSwitcherProps;
  panelRef: RefObject<HTMLDivElement | null>;
  selectedKey: Key | null;
  onSelect: (key: Key) => void;
  getActions: (key: Key) => MenuEntry[];
  actions: ReactNode;
}) {
  const strings = useUiStrings();
  const { views, defaultViewKey, isDirty = false } = props;
  return (
    <Tabs selectedKey={selectedKey ?? undefined} onSelectionChange={onSelect} size="sm">
      <div {...hooks.slot('bar')}>
        <TabList
          className={hooks.slotClass('tabs')}
          aria-label={props['aria-label'] ?? (props['aria-labelledby'] ? undefined : strings.views)}
          aria-labelledby={props['aria-labelledby']}
          overflow="menu"
          getMenuItems={(key) => getActions(key)}
        >
          {views.map((view) => (
            <Tab
              key={toKeyIdentity(view.id)}
              id={view.id}
              icon={view.icon}
              textValue={view.label}
              className={hooks.slotClass('tab')}
            >
              <ViewLabel
                view={view}
                isDefault={view.id === defaultViewKey}
                isModified={isDirty && view.id === selectedKey}
              />
            </Tab>
          ))}
        </TabList>
        {actions}
      </div>
      <TabPanelLink panelRef={panelRef} />
    </Tabs>
  );
}

/** The views in a menu whose button shows the selected view. */
function ViewMenu({
  props,
  selected,
  onSelect,
}: {
  props: ViewSwitcherProps;
  selected: ViewSwitcherView | undefined;
  onSelect: (key: Key) => void;
}) {
  const strings = useUiStrings();
  const { views, defaultViewKey, isDirty = false } = props;
  return (
    <DropdownMenu
      className={hooks.slotClass('menu')}
      label={
        selected ? (
          <ViewLabel
            view={selected}
            isDefault={selected.id === defaultViewKey}
            isModified={isDirty}
          />
        ) : (
          strings.views
        )
      }
      icon={selected?.icon}
      aria-label={props['aria-label'] ?? (props['aria-labelledby'] ? undefined : strings.views)}
      aria-labelledby={props['aria-labelledby']}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={selected ? [selected.id] : []}
      onSelectionChange={(keys) => {
        const [key] = keys === 'all' ? [] : [...keys];
        if (key !== undefined) onSelect(key);
      }}
      items={views.map((view) => ({
        id: view.id,
        label: view.label,
        icon: view.icon,
        description: view.id === defaultViewKey ? strings.defaultView : undefined,
      }))}
    />
  );
}

function findView(views: readonly ViewSwitcherView[], key: Key | null | undefined) {
  return key === null || key === undefined ? undefined : views.find((view) => view.id === key);
}

/**
 * The selected view: the chosen one while it is among `views`, else the default view, else the
 * first. An uncontrolled selection left on a view that is gone moves to that fallback and reports it.
 */
function useSelectedView(props: ViewSwitcherProps) {
  const { views, defaultViewKey } = props;
  const [chosenKey, select] = useControllableState<Key | null>(
    props.selectedKey,
    props.defaultSelectedKey ?? defaultViewKey ?? views[0]?.id ?? null,
    (key) => {
      if (key !== null) props.onSelectionChange?.(key);
    },
  );
  const selected = findView(views, chosenKey) ?? findView(views, defaultViewKey) ?? views[0];
  const selectedKey = selected?.id ?? null;
  const isStale =
    props.selectedKey === undefined && selectedKey !== null && chosenKey !== selectedKey;
  useEffect(() => {
    if (isStale) select(selectedKey);
  });
  return { selected, selectedKey, select };
}

/** Sets or removes an attribute so it holds `value`. */
function syncAttribute(element: Element, name: string, value: string | null) {
  if (value === null) element.removeAttribute(name);
  else if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/**
 * Ties the panel, kept outside the tabs, to the selected tab after every commit of the tabs, as
 * React Aria's tab panel would: the id the tab controls, the tab as its label, and a tab stop
 * while it holds nothing tabbable. Unmounting, when the variant changes, unties it.
 */
function TabPanelLink({ panelRef }: { panelRef: RefObject<HTMLDivElement | null> }) {
  // Commits with the tabs, whose selection lives in this context.
  useContext(TabListStateContext);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;
    const tab = panel.previousElementSibling?.querySelector('[role="tab"][aria-selected="true"]');
    syncAttribute(panel, 'id', tab?.getAttribute('aria-controls') ?? null);
    syncAttribute(panel, 'aria-labelledby', tab?.id || null);
    syncAttribute(panel, 'tabindex', listTabbables(panel).length === 0 ? '0' : null);
    return () => {
      for (const name of ['id', 'aria-labelledby', 'tabindex']) panel.removeAttribute(name);
    };
  });
  return null;
}

/**
 * The dialog a view's action opened, with the action it runs now. A dialog whose view or action is
 * gone closes, and stays closed if the action comes back.
 */
function useViewDialog(resolve: (request: ViewDialogRequest) => ViewDialog | null) {
  const [request, setRequest] = useState<ViewDialogRequest | null>(null);
  const resolved = request && resolve(request);
  if (request?.isOpen && !resolved) setRequest({ ...request, isOpen: false });
  return {
    dialog: resolved ?? (request && closedViewDialog(request)),
    open: setRequest,
    close: () => setRequest((open) => open && { ...open, isOpen: false }),
  };
}

/**
 * Names and switches the saved views of a collection, as tabs or a menu. The selected view shows a
 * modified mark while its settings differ from its saved ones; its actions save, save as a new
 * view, reset, rename, make it the default view or delete it, each tab also offering its own.
 */
export function ViewSwitcher(props: ViewSwitcherProps) {
  const { ref } = props;
  const { views, variant = 'tabs', isDirty = false, defaultViewKey = null } = props;
  const { className, id } = props;
  const strings = useUiStrings();
  const panelRef = useRef<HTMLDivElement>(null);
  const { selected, selectedKey, select: setSelectedKey } = useSelectedView(props);
  const canDelete = views.length > 1;
  const labelOf = (key: Key) => views.find((view) => view.id === key)?.label;
  const dialogs = useViewDialog((request) =>
    resolveViewDialog(request, { handlers: props, selectedKey, canDelete }, labelOf),
  );
  const context: ViewActionContext = {
    handlers: props,
    strings,
    selectedKey,
    isDirty,
    defaultViewKey,
    canDelete,
    openDialog: dialogs.open,
  };
  const getActions = (key: Key) => listViewActions(key, labelOf(key) ?? String(key), context);
  const selectedActions = selected ? getActions(selected.id) : [];
  const actions =
    selected && selectedActions.length > 0 ? (
      <DropdownMenu
        iconOnly
        label={strings.viewActions(selected.label)}
        variant="ghost"
        size="sm"
        className={hooks.slotClass('actions')}
        items={selectedActions}
      />
    ) : null;
  const data = { variant, dirty: isDirty };
  return (
    <div ref={ref} id={id} {...hooks.root({ className, props, data })}>
      {variant === 'tabs' ? (
        <ViewTabs
          props={props}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          getActions={getActions}
          actions={actions}
          panelRef={panelRef}
        />
      ) : (
        <div {...hooks.slot('bar')}>
          <ViewMenu props={props} selected={selected} onSelect={setSelectedKey} />
          {actions}
        </div>
      )}
      {/* The content keeps its place in either variant, so switching variants keeps its state. */}
      <div
        ref={panelRef}
        {...hooks.slot('panel')}
        role={variant === 'tabs' && selected ? 'tabpanel' : undefined}
      >
        {props.children}
      </div>
      <ViewDialogs dialog={dialogs.dialog} onClose={dialogs.close} />
    </div>
  );
}
