'use client';

import { type ReactNode, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isContextMenuKey } from '../../utils/is-context-menu-key.js';
import { isElement } from '../../utils/is-element.js';
import {
  ContextMenu,
  useContextMenuTarget,
  useMenuController,
} from '../context-menu/context-menu.js';
import { Menu } from '../menu/menu.js';
import { linkedChartHooks as hooks } from './chart-hooks.js';
import type { getChartMarks } from './chart-placement.js';

function cursorAt(target: EventTarget) {
  return isElement(target)
    ? target.closest('tr')?.querySelector<HTMLElement>('[data-mark-id]')
    : null;
}

export function CursorRowMenu({
  children,
  marks,
  onActivate,
}: {
  children: ReactNode;
  marks: ReturnType<typeof getChartMarks>;
  onActivate: (id: string) => void;
}) {
  const s = useUiStrings();
  const controller = useMenuController();
  const targetRef = useRef<HTMLElement | null>(null);
  const [name, setName] = useState<string>();
  const mark = marks.find((m) => m.id === name);
  const select = (target: EventTarget) => {
    const id = cursorAt(target)?.dataset.markId;
    setName(id);
    if (id !== undefined) onActivate(id);
  };
  const target = useContextMenuTarget({
    controller,
    targetRef,
    isDisabled: false,
    accepts: (el) => Boolean(cursorAt(el)),
    own: {
      onContextMenu: (event) => select(event.target),
      onPointerDownCapture: (event) => {
        select(event.target);
      },
      onKeyDownCapture: (event) => {
        if (isContextMenuKey(event)) select(event.target);
      },
    },
  });
  const drop = () => {
    if (name === undefined) return;
    const cells = Array.from(
      targetRef.current?.querySelectorAll<HTMLElement>('[data-mark-id]') ?? [],
    );
    const i = cells.findIndex((el) => el.dataset.markId === name);
    const next = cells[i + 1] ?? cells[i - 1] ?? targetRef.current;
    mark?.remove?.();
    (next?.querySelector<HTMLElement>('button') ?? next)?.focus({ preventScroll: true });
  };
  return (
    <>
      <div
        {...hooks.slot('measurements')}
        {...target}
        onFocusCapture={(event) => select(event.target)}
        tabIndex={-1}
      >
        {children}
      </div>
      <ContextMenu controller={controller} triggerRef={targetRef}>
        <Menu
          aria-label={mark?.label ?? s.chartReadings}
          items={[
            {
              id: 'delete',
              label: mark?.kind === 'marker' ? s.remove + ' ' + mark.label : s.chartDeleteCursor,
              onAction: drop,
            },
          ]}
        />
      </ContextMenu>
    </>
  );
}
