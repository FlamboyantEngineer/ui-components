import { describe, expect, it } from 'vitest';
import { resolveMenubarKey, type MenubarKeyPress } from './menubar-keys.js';

const row: Omit<MenubarKeyPress, 'key'> = {
  orientation: 'horizontal',
  direction: 'ltr',
  place: 'bar',
  hasSubmenu: false,
};

function resolve(key: string, press: Partial<MenubarKeyPress> = {}) {
  return resolveMenubarKey({ ...row, ...press, key });
}

describe('resolveMenubarKey', () => {
  it('UIC-MENUBAR-1.4 moves along a row by its arrows, Home and End, reversed right to left', () => {
    expect(resolve('ArrowRight')).toEqual({ type: 'move', to: 'next' });
    expect(resolve('ArrowLeft')).toEqual({ type: 'move', to: 'previous' });
    expect(resolve('Home')).toEqual({ type: 'move', to: 'first' });
    expect(resolve('End')).toEqual({ type: 'move', to: 'last' });
    expect(resolve('ArrowLeft', { direction: 'rtl' })).toEqual({ type: 'move', to: 'next' });
    // React Aria's trigger opens the menu on these.
    expect(resolve('ArrowDown')).toBeNull();
    expect(resolve('ArrowUp')).toBeNull();
    expect(resolve('Enter')).toBeNull();
  });

  it('UIC-MENUBAR-1.4 UIC-MENUBAR-2.1 moves along a column by Up and Down and opens forward', () => {
    const column = { orientation: 'vertical' } as const;
    expect(resolve('ArrowDown', column)).toEqual({ type: 'move', to: 'next' });
    expect(resolve('ArrowUp', column)).toEqual({ type: 'move', to: 'previous' });
    expect(resolve('ArrowRight', column)).toEqual({ type: 'open' });
    expect(resolve('ArrowLeft', { ...column, direction: 'rtl' })).toEqual({ type: 'open' });
    expect(resolve('ArrowLeft', column)).toBeNull();
  });

  it('UIC-MENUBAR-2.2 passes between menus in a row, leaving submenu keys to React Aria', () => {
    expect(resolve('ArrowRight', { place: 'menu' })).toEqual({ type: 'move', to: 'next' });
    expect(resolve('ArrowRight', { place: 'submenu' })).toEqual({ type: 'move', to: 'next' });
    expect(resolve('ArrowLeft', { place: 'menu' })).toEqual({ type: 'move', to: 'previous' });
    expect(resolve('ArrowRight', { place: 'menu', hasSubmenu: true })).toBeNull();
    expect(resolve('ArrowLeft', { place: 'submenu' })).toBeNull();
    expect(resolve('ArrowLeft', { place: 'menu', direction: 'rtl' })).toEqual({
      type: 'move',
      to: 'next',
    });
    expect(resolve('Home', { place: 'menu' })).toBeNull();
    expect(resolve('ArrowDown', { place: 'menu' })).toBeNull();
  });

  it('UIC-MENUBAR-2.2 closes a column menu backwards and leaves the rest to React Aria', () => {
    const column = { orientation: 'vertical' } as const;
    expect(resolve('ArrowLeft', { ...column, place: 'menu' })).toEqual({ type: 'close' });
    expect(resolve('ArrowRight', { ...column, place: 'menu', direction: 'rtl' })).toEqual({
      type: 'close',
    });
    expect(resolve('ArrowLeft', { ...column, place: 'submenu' })).toBeNull();
    expect(resolve('ArrowRight', { ...column, place: 'menu' })).toBeNull();
  });
});
