import { createContext } from 'react';
import type { Size } from '../../core/props.js';

export type MenuSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** The row density of the enclosing menu, which submenus and item icons take. */
export const MenuSizeContext = createContext<MenuSize>('md');
