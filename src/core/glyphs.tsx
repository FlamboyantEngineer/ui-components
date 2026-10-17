import {
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowsUpDownIcon,
  Bars2Icon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  EllipsisHorizontalIcon,
  EllipsisVerticalIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType } from 'react';

/** Props the library passes to a glyph component. Any SVG icon component that accepts them works. */
export interface GlyphComponentProps {
  className?: string;
  'data-glyph'?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  focusable?: boolean | 'true' | 'false';
}

export type GlyphComponent = ComponentType<GlyphComponentProps>;

/** The built-in glyphs every component draws from. Hosts replace any of them through `UiProvider`. */
export const defaultGlyphs = {
  'chevron-down': ChevronDownIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-double-left': ChevronDoubleLeftIcon,
  'chevron-double-right': ChevronDoubleRightIcon,
  close: XMarkIcon,
  check: CheckIcon,
  more: EllipsisHorizontalIcon,
  'more-vertical': EllipsisVerticalIcon,
  'sort-ascending': ArrowUpIcon,
  'sort-descending': ArrowDownIcon,
  'sort-none': ArrowsUpDownIcon,
  expand: ArrowsPointingOutIcon,
  collapse: ArrowsPointingInIcon,
  search: MagnifyingGlassIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
  error: ExclamationCircleIcon,
  success: CheckCircleIcon,
  help: QuestionMarkCircleIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  undo: ArrowUturnLeftIcon,
  redo: ArrowUturnRightIcon,
  restore: ArrowPathIcon,
  'drag-handle': Bars2Icon,
} satisfies Record<string, GlyphComponent>;

export type GlyphName = keyof typeof defaultGlyphs;

export type GlyphMap = Record<GlyphName, GlyphComponent>;

export const glyphNames = Object.keys(defaultGlyphs) as GlyphName[];
