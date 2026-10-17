import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  createMenuController,
  isElementAnchor,
  useMenuController,
  useMenuControllerState,
} from './menu-controller.js';

describe('createMenuController', () => {
  it('UIC-CONTEXT-MENU-2.1 opens, moves, updates and closes, notifying after each change', () => {
    const controller = createMenuController();
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);
    const closed = controller.getSnapshot();
    expect(closed).toEqual({ isOpen: false, anchor: null, items: undefined });
    expect(Object.isFrozen(closed)).toBe(true);

    controller.move({ x: 1, y: 1 });
    controller.close();
    expect(listener).not.toHaveBeenCalled();

    const items = [{ id: 'apple', label: 'Apple' }];
    controller.open({ x: 10, y: 20 }, { items });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(controller.isOpen()).toBe(true);
    const opened = controller.getSnapshot();
    expect(opened).toEqual({ isOpen: true, anchor: { x: 10, y: 20 }, items });
    expect(opened).not.toBe(closed);

    controller.move({ x: 30, y: 40 });
    expect(controller.getSnapshot().anchor).toEqual({ x: 30, y: 40 });
    expect(controller.getSnapshot().items).toBe(items);

    const element = document.createElement('button');
    controller.open(element);
    expect(controller.getSnapshot().anchor).toBe(element);
    expect(controller.getSnapshot().items).toBe(items);

    const more = [{ id: 'pear', label: 'Pear' }];
    controller.setItems(more);
    expect(controller.getSnapshot().items).toBe(more);
    const unchanged = controller.getSnapshot();
    controller.setItems(more);
    expect(controller.getSnapshot()).toBe(unchanged);

    controller.close();
    expect(controller.getSnapshot()).toEqual({ isOpen: false, anchor: null, items: more });
    expect(listener).toHaveBeenCalledTimes(5);

    unsubscribe();
    controller.open({ x: 0, y: 0 });
    expect(listener).toHaveBeenCalledTimes(5);
  });

  it('UIC-CONTEXT-MENU-2.1 tells element anchors from points', () => {
    expect(isElementAnchor(document.createElement('div'))).toBe(true);
    expect(isElementAnchor({ x: 1, y: 2 })).toBe(false);
  });

  it('UIC-CONTEXT-MENU-2.1 keeps one controller per component and subscribes to its state', () => {
    const { result, rerender } = renderHook(() => {
      const controller = useMenuController();
      return { controller, state: useMenuControllerState(controller) };
    });
    const first = result.current.controller;
    rerender();
    expect(result.current.controller).toBe(first);
    expect(result.current.state.isOpen).toBe(false);
    act(() => first.open({ x: 5, y: 6 }));
    expect(result.current.state).toEqual({
      isOpen: true,
      anchor: { x: 5, y: 6 },
      items: undefined,
    });
    act(() => first.close());
    expect(result.current.state.isOpen).toBe(false);
  });
});
