'use client';

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import { measureContentBox, tolerance } from '../../utils/overflow-measure.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import type { TabListPartsModel } from './tab-list-parts.js';

const pixels = (value: string | undefined) => Number.parseFloat(value ?? '') || 0;

function style(element: Element) {
  return element.ownerDocument.defaultView?.getComputedStyle(element);
}

function outerWidth(element: Element) {
  const css = style(element);
  return element.getBoundingClientRect().width + pixels(css?.marginLeft) + pixels(css?.marginRight);
}

interface ActionRoom {
  model: TabListPartsModel;
  list: HTMLElement;
  selectedKey: Key | null;
  widths: Map<string, number>;
  indicator: number;
}

/** Cache intrinsic part widths before the overflow renderer removes any children. */
function rememberWidths({ model, list, widths }: ActionRoom) {
  for (const id of widths.keys()) if (!model.byId.has(id)) widths.delete(id);
  if (list.children.length === model.parts.length) {
    model.parts.forEach((part, index) => {
      const element = list.children[index];
      if (element) widths.set(part.id, outerWidth(element));
    });
    return;
  }
  const actions = model.parts.filter((part) => part.kind === 'action');
  const rendered = [...list.children].filter((element) => element.matches('.ui-tabs__action'));
  if (rendered.length === actions.length) {
    actions.forEach((part, index) => {
      const element = rendered[index];
      if (element) widths.set(part.id, outerWidth(element));
    });
  }
}

/** A menu needs room for every action, its selected tab and the indicator. Otherwise scroll. */
function needsScroll(room: ActionRoom) {
  const { model, list, selectedKey, widths, indicator } = room;
  rememberWidths(room);
  if (model.parts.some((part) => !widths.has(part.id))) return false;
  const bar = list.parentElement;
  if (!bar) return false;
  const barGap = pixels(style(bar)?.columnGap);
  const listCss = style(list);
  const gap = pixels(listCss?.columnGap);
  const fixed = [...bar.children].filter(
    (element) => element !== list && !element.matches('.ui-tabs__overflow'),
  );
  const chrome = [
    'marginLeft',
    'marginRight',
    'borderLeftWidth',
    'borderRightWidth',
    'paddingLeft',
    'paddingRight',
  ].reduce(
    (sum, name) => sum + pixels(listCss?.[name as keyof CSSStyleDeclaration] as string | undefined),
    0,
  );
  const available =
    measureContentBox(bar).width -
    chrome -
    fixed.reduce((sum, element) => sum + outerWidth(element) + barGap, 0);
  const widthOf = (parts: typeof model.parts) =>
    parts.reduce((sum, part) => sum + (widths.get(part.id) ?? 0), 0) +
    Math.max(0, parts.length - 1) * gap;
  if (widthOf(model.parts) <= available + tolerance) return false;
  const required = model.parts.filter((part) => part.kind === 'action' || part.key === selectedKey);
  return widthOf(required) + indicator + barGap > available + tolerance;
}

/** Retain ordinary controls and a real selected tab even when a menu cannot physically fit. */
export function useTabActionScroll(
  listRef: RefObject<HTMLElement | null>,
  {
    model,
    selectedKey,
    enabled,
  }: { model: TabListPartsModel | null; selectedKey: Key | null; enabled: boolean },
): boolean {
  const [scroll, setScroll] = useState(false);
  const currentScroll = useRef(false);
  const widths = useRef(new Map<string, number>());
  const indicator = useRef(0);
  const measure = useCallback(() => {
    const list = listRef.current;
    if (!enabled || !model || !list?.parentElement) return;
    const more = list.parentElement.querySelector(':scope > .ui-tabs__overflow');
    if (more) indicator.current = outerWidth(more);
    const next = needsScroll({
      model,
      list,
      selectedKey,
      widths: widths.current,
      indicator: indicator.current,
    });
    if (currentScroll.current !== next) {
      currentScroll.current = next;
      setScroll(next);
    }
  }, [listRef, model, selectedKey, enabled]);
  useLayoutEffect(measure);
  useLayoutEffect(() => {
    const list = listRef.current;
    const Observer = list?.ownerDocument.defaultView?.MutationObserver;
    if (!enabled || !model || !list?.parentElement || !Observer) return undefined;
    const observer = new Observer(measure);
    observer.observe(list.parentElement, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  });
  useResizeObserver(() => {
    const list = listRef.current;
    return enabled && model && list ? [list, list.parentElement, ...list.children] : [];
  }, measure);
  return enabled && model !== null && scroll;
}
