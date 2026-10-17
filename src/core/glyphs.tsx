import {
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowUpTrayIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowsRightLeftIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowsUpDownIcon,
  Bars2Icon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
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
  EyeDropperIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PencilSquareIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType } from 'react';

/** Props the library passes to a glyph component. Any SVG icon component that accepts them works. */
export interface GlyphComponentProps {
  /** The glyph and slot classes. */
  className?: string;
  /** The glyph's built-in name. */
  'data-glyph'?: string;
  /** Glyphs are decorative. */
  'aria-hidden'?: boolean | 'true' | 'false';
  /** Keeps the SVG out of the tab order in browsers that focus SVG. */
  focusable?: boolean | 'true' | 'false';
}

export type GlyphComponent = ComponentType<GlyphComponentProps>;

export type GlyphName = keyof typeof defaultGlyphs;

export type GlyphMap = Record<GlyphName, GlyphComponent>;

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
  refresh: ArrowPathIcon,
  edit: PencilSquareIcon,
  copy: DocumentDuplicateIcon,
  save: CheckIcon,
  delete: TrashIcon,
  calendar: CalendarIcon,
  'drag-handle': Bars2Icon,
  upload: ArrowUpTrayIcon,
  folder: FolderIcon,
  users: UsersIcon,
  'fit-width': ArrowsRightLeftIcon,
  'fit-page': DocumentIcon,
  'eye-dropper': EyeDropperIcon,
  eye: EyeIcon,
  'eye-slash': EyeSlashIcon,
  scrub: ArrowsRightLeftIcon,
} satisfies Record<string, GlyphComponent>;

export const glyphNames = Object.keys(defaultGlyphs) as GlyphName[];
