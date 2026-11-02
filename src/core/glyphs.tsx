'use client';

import {
  adjustmentsHorizontalPath,
  archiveBoxPath,
  arrowDownPath,
  arrowDownTrayPath,
  arrowLeftPath,
  arrowLongRightPath,
  arrowPathPath,
  arrowPathRoundedSquarePath,
  arrowRightPath,
  arrowTopRightOnSquarePath,
  arrowTrendingDownPath,
  arrowTrendingUpPath,
  arrowUpPath,
  arrowUpTrayPath,
  arrowUturnLeftPath,
  arrowUturnRightPath,
  arrowsPointingInPath,
  arrowsDiagonalPath,
  arrowsPointingOutPath,
  arrowsRightLeftPath,
  arrowsUpDownPath,
  bars2Path,
  bars3BottomLeftPath,
  bellPath,
  bellSlashPath,
  boldPath,
  calendarPath,
  chatBubbleBottomCenterTextPath,
  checkCirclePath,
  checkPath,
  chevronDoubleLeftPath,
  chevronDoubleRightPath,
  chevronDownPath,
  chevronLeftPath,
  chevronRightPath,
  chevronUpPath,
  clipboardDocumentCheckPath,
  clipboardPath,
  clockPath,
  codeBracketPath,
  codeBracketSquarePath,
  commandLinePath,
  documentDuplicatePath,
  documentPath,
  documentTextPath,
  ellipsisHorizontalCirclePath,
  ellipsisHorizontalPath,
  ellipsisVerticalPath,
  envelopeOpenPath,
  envelopePath,
  exclamationCirclePath,
  exclamationTrianglePath,
  eyeDropperPath,
  eyePath,
  eyeSlashPath,
  faceSmilePath,
  filmPath,
  folderPath,
  functionPath,
  funnelPath,
  globeAltPath,
  h1Path,
  h2Path,
  h3Path,
  handRaisedPath,
  handThumbDownPath,
  handThumbUpPath,
  informationCirclePath,
  italicPath,
  linkPath,
  linkSlashPath,
  listBulletPath,
  lockClosedPath,
  magnifyingGlassPath,
  minusCirclePath,
  minusPath,
  musicalNotePath,
  newspaperPath,
  noSymbolPath,
  numberedListPath,
  paperAirplanePath,
  paperClipPath,
  pausePath,
  pencilSquarePath,
  photoPath,
  playPath,
  plusPath,
  questionMarkCirclePath,
  signalSlashPath,
  sparklesPath,
  starPath,
  stopPath,
  strikethroughPath,
  tableCellsPath,
  trashPath,
  underlinePath,
  usersPath,
  viewColumnsPath,
  wrenchPath,
  xCirclePath,
  xMarkPath,
} from './glyph-paths.js';
import { createGlyph } from './glyph-component.js';
export type { GlyphComponent, GlyphComponentProps, GlyphMap, GlyphName } from './glyph-types.js';

/** Individually imported defaults; each honors its UiProvider override. */
export const ChevronDownGlyph = /* @__PURE__ */ createGlyph('chevron-down', chevronDownPath);
export const ChevronUpGlyph = /* @__PURE__ */ createGlyph('chevron-up', chevronUpPath);
export const ChevronLeftGlyph = /* @__PURE__ */ createGlyph('chevron-left', chevronLeftPath);
export const ChevronRightGlyph = /* @__PURE__ */ createGlyph('chevron-right', chevronRightPath);
export const ChevronDoubleLeftGlyph = /* @__PURE__ */ createGlyph(
  'chevron-double-left',
  chevronDoubleLeftPath,
);
export const ChevronDoubleRightGlyph = /* @__PURE__ */ createGlyph(
  'chevron-double-right',
  chevronDoubleRightPath,
);
export const ArrowUpGlyph = /* @__PURE__ */ createGlyph('arrow-up', arrowUpPath);
export const ArrowDownGlyph = /* @__PURE__ */ createGlyph('arrow-down', arrowDownPath);
export const ArrowLeftGlyph = /* @__PURE__ */ createGlyph('arrow-left', arrowLeftPath);
export const ArrowRightGlyph = /* @__PURE__ */ createGlyph('arrow-right', arrowRightPath);
export const CloseGlyph = /* @__PURE__ */ createGlyph('close', xMarkPath);
export const CheckGlyph = /* @__PURE__ */ createGlyph('check', checkPath);
export const MoreGlyph = /* @__PURE__ */ createGlyph('more', ellipsisHorizontalPath);
export const MoreVerticalGlyph = /* @__PURE__ */ createGlyph('more-vertical', ellipsisVerticalPath);
export const SortAscendingGlyph = /* @__PURE__ */ createGlyph('sort-ascending', arrowUpPath);
export const SortDescendingGlyph = /* @__PURE__ */ createGlyph('sort-descending', arrowDownPath);
export const SortNoneGlyph = /* @__PURE__ */ createGlyph('sort-none', arrowsUpDownPath);
export const ExpandGlyph = /* @__PURE__ */ createGlyph('expand', arrowsPointingOutPath);
export const CollapseGlyph = /* @__PURE__ */ createGlyph('collapse', arrowsPointingInPath);
export const SearchGlyph = /* @__PURE__ */ createGlyph('search', magnifyingGlassPath);
export const FilterGlyph = /* @__PURE__ */ createGlyph('filter', funnelPath);
export const InfoGlyph = /* @__PURE__ */ createGlyph('info', informationCirclePath);
export const WarningGlyph = /* @__PURE__ */ createGlyph('warning', exclamationTrianglePath);
export const ErrorGlyph = /* @__PURE__ */ createGlyph('error', exclamationCirclePath);
export const SuccessGlyph = /* @__PURE__ */ createGlyph('success', checkCirclePath);
export const HelpGlyph = /* @__PURE__ */ createGlyph('help', questionMarkCirclePath);
export const PlusGlyph = /* @__PURE__ */ createGlyph('plus', plusPath);
export const MinusGlyph = /* @__PURE__ */ createGlyph('minus', minusPath);
export const UndoGlyph = /* @__PURE__ */ createGlyph('undo', arrowUturnLeftPath);
export const RedoGlyph = /* @__PURE__ */ createGlyph('redo', arrowUturnRightPath);
export const RestoreGlyph = /* @__PURE__ */ createGlyph('restore', arrowPathPath);
export const RefreshGlyph = /* @__PURE__ */ createGlyph('refresh', arrowPathPath);
export const EditGlyph = /* @__PURE__ */ createGlyph('edit', pencilSquarePath);
export const CopyGlyph = /* @__PURE__ */ createGlyph('copy', documentDuplicatePath);
export const SaveGlyph = /* @__PURE__ */ createGlyph('save', checkPath);
export const DeleteGlyph = /* @__PURE__ */ createGlyph('delete', trashPath);
export const CalendarGlyph = /* @__PURE__ */ createGlyph('calendar', calendarPath);
export const DragHandleGlyph = /* @__PURE__ */ createGlyph('drag-handle', bars2Path);
export const UploadGlyph = /* @__PURE__ */ createGlyph('upload', arrowUpTrayPath);
export const FolderGlyph = /* @__PURE__ */ createGlyph('folder', folderPath);
export const UsersGlyph = /* @__PURE__ */ createGlyph('users', usersPath);
export const FitWidthGlyph = /* @__PURE__ */ createGlyph('fit-width', arrowsRightLeftPath);
export const FitPageGlyph = /* @__PURE__ */ createGlyph('fit-page', documentPath);
export const EyeDropperGlyph = /* @__PURE__ */ createGlyph('eye-dropper', eyeDropperPath);
export const EyeGlyph = /* @__PURE__ */ createGlyph('eye', eyePath);
export const EyeSlashGlyph = /* @__PURE__ */ createGlyph('eye-slash', eyeSlashPath);
export const ScrubGlyph = /* @__PURE__ */ createGlyph('scrub', arrowsRightLeftPath);
export const LinkGlyph = /* @__PURE__ */ createGlyph('link', linkPath);
export const ExternalLinkGlyph = /* @__PURE__ */ createGlyph(
  'external-link',
  arrowTopRightOnSquarePath,
);
export const SidebarGlyph = /* @__PURE__ */ createGlyph('sidebar', viewColumnsPath);
export const TrendUpGlyph = /* @__PURE__ */ createGlyph('trend-up', arrowTrendingUpPath);
export const TrendDownGlyph = /* @__PURE__ */ createGlyph('trend-down', arrowTrendingDownPath);
export const TrendFlatGlyph = /* @__PURE__ */ createGlyph('trend-flat', arrowLongRightPath);
export const OfflineGlyph = /* @__PURE__ */ createGlyph('offline', signalSlashPath);
export const LockGlyph = /* @__PURE__ */ createGlyph('lock', lockClosedPath);
export const EmojiGlyph = /* @__PURE__ */ createGlyph('emoji', faceSmilePath);
export const BellGlyph = /* @__PURE__ */ createGlyph('bell', bellPath);
export const ClockGlyph = /* @__PURE__ */ createGlyph('clock', clockPath);
export const EnvelopeGlyph = /* @__PURE__ */ createGlyph('envelope', envelopePath);
export const EnvelopeOpenGlyph = /* @__PURE__ */ createGlyph('envelope-open', envelopeOpenPath);
export const SendGlyph = /* @__PURE__ */ createGlyph('send', paperAirplanePath);
export const AttachGlyph = /* @__PURE__ */ createGlyph('attach', paperClipPath);
export const StopGlyph = /* @__PURE__ */ createGlyph('stop', stopPath);
export const DownloadGlyph = /* @__PURE__ */ createGlyph('download', arrowDownTrayPath);
export const RotateGlyph = /* @__PURE__ */ createGlyph('rotate', arrowPathRoundedSquarePath);
export const FileGlyph = /* @__PURE__ */ createGlyph('file', documentPath);
export const ImageGlyph = /* @__PURE__ */ createGlyph('image', photoPath);
export const VideoGlyph = /* @__PURE__ */ createGlyph('video', filmPath);
export const AudioGlyph = /* @__PURE__ */ createGlyph('audio', musicalNotePath);
export const FilePdfGlyph = /* @__PURE__ */ createGlyph('file-pdf', newspaperPath);
export const FileArchiveGlyph = /* @__PURE__ */ createGlyph('file-archive', archiveBoxPath);
export const FileTextGlyph = /* @__PURE__ */ createGlyph('file-text', documentTextPath);
export const StarGlyph = /* @__PURE__ */ createGlyph('star', starPath);
export const AdjustmentsGlyph = /* @__PURE__ */ createGlyph(
  'adjustments',
  adjustmentsHorizontalPath,
);
export const MoveGlyph = /* @__PURE__ */ createGlyph('move', arrowsUpDownPath);
export const TableGlyph = /* @__PURE__ */ createGlyph('table', tableCellsPath);
export const ResizeGlyph = /* @__PURE__ */ createGlyph('resize', arrowsDiagonalPath);
export const FormulaGlyph = /* @__PURE__ */ createGlyph('formula', functionPath);
export const PlayGlyph = /* @__PURE__ */ createGlyph('play', playPath);
export const PauseGlyph = /* @__PURE__ */ createGlyph('pause', pausePath);
export const ParagraphGlyph = /* @__PURE__ */ createGlyph('paragraph', bars3BottomLeftPath);
export const BoldGlyph = /* @__PURE__ */ createGlyph('bold', boldPath, 'butt');
export const ItalicGlyph = /* @__PURE__ */ createGlyph('italic', italicPath);
export const UnderlineGlyph = /* @__PURE__ */ createGlyph('underline', underlinePath);
export const StrikethroughGlyph = /* @__PURE__ */ createGlyph('strikethrough', strikethroughPath);
export const CodeGlyph = /* @__PURE__ */ createGlyph('code', codeBracketPath);
export const CodeBlockGlyph = /* @__PURE__ */ createGlyph('code-block', codeBracketSquarePath);
export const Heading1Glyph = /* @__PURE__ */ createGlyph('heading-1', h1Path);
export const Heading2Glyph = /* @__PURE__ */ createGlyph('heading-2', h2Path);
export const Heading3Glyph = /* @__PURE__ */ createGlyph('heading-3', h3Path);
export const ListBulletGlyph = /* @__PURE__ */ createGlyph('list-bullet', listBulletPath);
export const ListNumberedGlyph = /* @__PURE__ */ createGlyph('list-numbered', numberedListPath);
export const ListTaskGlyph = /* @__PURE__ */ createGlyph('list-task', clipboardDocumentCheckPath);
export const QuoteGlyph = /* @__PURE__ */ createGlyph('quote', chatBubbleBottomCenterTextPath);
export const UnlinkGlyph = /* @__PURE__ */ createGlyph('unlink', linkSlashPath);
export const PendingGlyph = /* @__PURE__ */ createGlyph('pending', ellipsisHorizontalCirclePath);
export const SkippedGlyph = /* @__PURE__ */ createGlyph('skipped', minusCirclePath);
export const HandRaisedGlyph = /* @__PURE__ */ createGlyph('hand-raised', handRaisedPath);
export const NoSymbolGlyph = /* @__PURE__ */ createGlyph('no-symbol', noSymbolPath);
export const XCircleGlyph = /* @__PURE__ */ createGlyph('x-circle', xCirclePath);
export const ThumbsUpGlyph = /* @__PURE__ */ createGlyph('thumbs-up', handThumbUpPath);
export const ThumbsDownGlyph = /* @__PURE__ */ createGlyph('thumbs-down', handThumbDownPath);
export const ReplyGlyph = /* @__PURE__ */ createGlyph('reply', arrowUturnLeftPath);
export const BellSlashGlyph = /* @__PURE__ */ createGlyph('bell-slash', bellSlashPath);
export const TerminalGlyph = /* @__PURE__ */ createGlyph('terminal', commandLinePath);
export const GlobeGlyph = /* @__PURE__ */ createGlyph('globe', globeAltPath);
export const WrenchGlyph = /* @__PURE__ */ createGlyph('wrench', wrenchPath);
export const SparklesGlyph = /* @__PURE__ */ createGlyph('sparkles', sparklesPath);
export const ClipboardGlyph = /* @__PURE__ */ createGlyph('clipboard', clipboardPath);
