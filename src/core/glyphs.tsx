import {
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowLongRightIcon,
  ArrowPathIcon,
  ArrowPathRoundedSquareIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowUpTrayIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowsRightLeftIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowsUpDownIcon,
  Bars2Icon,
  BellIcon,
  BellSlashIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CommandLineIcon,
  DocumentDuplicateIcon,
  DocumentIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
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
  FaceSmileIcon,
  FilmIcon,
  FolderIcon,
  FunnelIcon,
  GlobeAltIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  InformationCircleIcon,
  LinkIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  MusicalNoteIcon,
  NewspaperIcon,
  PencilSquareIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PauseIcon,
  PhotoIcon,
  PlayIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  SignalSlashIcon,
  SparklesIcon,
  StarIcon,
  StopIcon,
  TableCellsIcon,
  TrashIcon,
  UsersIcon,
  VariableIcon,
  ViewColumnsIcon,
  WrenchIcon,
  XMarkIcon,
  Bars3BottomLeftIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
  H1Icon,
  H2Icon,
  H3Icon,
  ListBulletIcon,
  NumberedListIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleBottomCenterTextIcon,
  LinkSlashIcon,
  EllipsisHorizontalCircleIcon,
  MinusCircleIcon,
  HandRaisedIcon,
  NoSymbolIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { createGlyph } from './glyph-component.js';
export type { GlyphComponent, GlyphComponentProps, GlyphMap, GlyphName } from './glyph-types.js';

/** Individually imported defaults; each honors its UiProvider override. */
export const ChevronDownGlyph = /* @__PURE__ */ createGlyph('chevron-down', ChevronDownIcon);
export const ChevronUpGlyph = /* @__PURE__ */ createGlyph('chevron-up', ChevronUpIcon);
export const ChevronLeftGlyph = /* @__PURE__ */ createGlyph('chevron-left', ChevronLeftIcon);
export const ChevronRightGlyph = /* @__PURE__ */ createGlyph('chevron-right', ChevronRightIcon);
export const ChevronDoubleLeftGlyph = /* @__PURE__ */ createGlyph(
  'chevron-double-left',
  ChevronDoubleLeftIcon,
);
export const ChevronDoubleRightGlyph = /* @__PURE__ */ createGlyph(
  'chevron-double-right',
  ChevronDoubleRightIcon,
);
export const ArrowUpGlyph = /* @__PURE__ */ createGlyph('arrow-up', ArrowUpIcon);
export const ArrowDownGlyph = /* @__PURE__ */ createGlyph('arrow-down', ArrowDownIcon);
export const ArrowLeftGlyph = /* @__PURE__ */ createGlyph('arrow-left', ArrowLeftIcon);
export const ArrowRightGlyph = /* @__PURE__ */ createGlyph('arrow-right', ArrowRightIcon);
export const CloseGlyph = /* @__PURE__ */ createGlyph('close', XMarkIcon);
export const CheckGlyph = /* @__PURE__ */ createGlyph('check', CheckIcon);
export const MoreGlyph = /* @__PURE__ */ createGlyph('more', EllipsisHorizontalIcon);
export const MoreVerticalGlyph = /* @__PURE__ */ createGlyph('more-vertical', EllipsisVerticalIcon);
export const SortAscendingGlyph = /* @__PURE__ */ createGlyph('sort-ascending', ArrowUpIcon);
export const SortDescendingGlyph = /* @__PURE__ */ createGlyph('sort-descending', ArrowDownIcon);
export const SortNoneGlyph = /* @__PURE__ */ createGlyph('sort-none', ArrowsUpDownIcon);
export const ExpandGlyph = /* @__PURE__ */ createGlyph('expand', ArrowsPointingOutIcon);
export const CollapseGlyph = /* @__PURE__ */ createGlyph('collapse', ArrowsPointingInIcon);
export const SearchGlyph = /* @__PURE__ */ createGlyph('search', MagnifyingGlassIcon);
export const FilterGlyph = /* @__PURE__ */ createGlyph('filter', FunnelIcon);
export const InfoGlyph = /* @__PURE__ */ createGlyph('info', InformationCircleIcon);
export const WarningGlyph = /* @__PURE__ */ createGlyph('warning', ExclamationTriangleIcon);
export const ErrorGlyph = /* @__PURE__ */ createGlyph('error', ExclamationCircleIcon);
export const SuccessGlyph = /* @__PURE__ */ createGlyph('success', CheckCircleIcon);
export const HelpGlyph = /* @__PURE__ */ createGlyph('help', QuestionMarkCircleIcon);
export const PlusGlyph = /* @__PURE__ */ createGlyph('plus', PlusIcon);
export const MinusGlyph = /* @__PURE__ */ createGlyph('minus', MinusIcon);
export const UndoGlyph = /* @__PURE__ */ createGlyph('undo', ArrowUturnLeftIcon);
export const RedoGlyph = /* @__PURE__ */ createGlyph('redo', ArrowUturnRightIcon);
export const RestoreGlyph = /* @__PURE__ */ createGlyph('restore', ArrowPathIcon);
export const RefreshGlyph = /* @__PURE__ */ createGlyph('refresh', ArrowPathIcon);
export const EditGlyph = /* @__PURE__ */ createGlyph('edit', PencilSquareIcon);
export const CopyGlyph = /* @__PURE__ */ createGlyph('copy', DocumentDuplicateIcon);
export const SaveGlyph = /* @__PURE__ */ createGlyph('save', CheckIcon);
export const DeleteGlyph = /* @__PURE__ */ createGlyph('delete', TrashIcon);
export const CalendarGlyph = /* @__PURE__ */ createGlyph('calendar', CalendarIcon);
export const DragHandleGlyph = /* @__PURE__ */ createGlyph('drag-handle', Bars2Icon);
export const UploadGlyph = /* @__PURE__ */ createGlyph('upload', ArrowUpTrayIcon);
export const FolderGlyph = /* @__PURE__ */ createGlyph('folder', FolderIcon);
export const UsersGlyph = /* @__PURE__ */ createGlyph('users', UsersIcon);
export const FitWidthGlyph = /* @__PURE__ */ createGlyph('fit-width', ArrowsRightLeftIcon);
export const FitPageGlyph = /* @__PURE__ */ createGlyph('fit-page', DocumentIcon);
export const EyeDropperGlyph = /* @__PURE__ */ createGlyph('eye-dropper', EyeDropperIcon);
export const EyeGlyph = /* @__PURE__ */ createGlyph('eye', EyeIcon);
export const EyeSlashGlyph = /* @__PURE__ */ createGlyph('eye-slash', EyeSlashIcon);
export const ScrubGlyph = /* @__PURE__ */ createGlyph('scrub', ArrowsRightLeftIcon);
export const LinkGlyph = /* @__PURE__ */ createGlyph('link', LinkIcon);
export const ExternalLinkGlyph = /* @__PURE__ */ createGlyph(
  'external-link',
  ArrowTopRightOnSquareIcon,
);
export const SidebarGlyph = /* @__PURE__ */ createGlyph('sidebar', ViewColumnsIcon);
export const TrendUpGlyph = /* @__PURE__ */ createGlyph('trend-up', ArrowTrendingUpIcon);
export const TrendDownGlyph = /* @__PURE__ */ createGlyph('trend-down', ArrowTrendingDownIcon);
export const TrendFlatGlyph = /* @__PURE__ */ createGlyph('trend-flat', ArrowLongRightIcon);
export const OfflineGlyph = /* @__PURE__ */ createGlyph('offline', SignalSlashIcon);
export const LockGlyph = /* @__PURE__ */ createGlyph('lock', LockClosedIcon);
export const EmojiGlyph = /* @__PURE__ */ createGlyph('emoji', FaceSmileIcon);
export const BellGlyph = /* @__PURE__ */ createGlyph('bell', BellIcon);
export const ClockGlyph = /* @__PURE__ */ createGlyph('clock', ClockIcon);
export const EnvelopeGlyph = /* @__PURE__ */ createGlyph('envelope', EnvelopeIcon);
export const EnvelopeOpenGlyph = /* @__PURE__ */ createGlyph('envelope-open', EnvelopeOpenIcon);
export const SendGlyph = /* @__PURE__ */ createGlyph('send', PaperAirplaneIcon);
export const AttachGlyph = /* @__PURE__ */ createGlyph('attach', PaperClipIcon);
export const StopGlyph = /* @__PURE__ */ createGlyph('stop', StopIcon);
export const DownloadGlyph = /* @__PURE__ */ createGlyph('download', ArrowDownTrayIcon);
export const RotateGlyph = /* @__PURE__ */ createGlyph('rotate', ArrowPathRoundedSquareIcon);
export const FileGlyph = /* @__PURE__ */ createGlyph('file', DocumentIcon);
export const ImageGlyph = /* @__PURE__ */ createGlyph('image', PhotoIcon);
export const VideoGlyph = /* @__PURE__ */ createGlyph('video', FilmIcon);
export const AudioGlyph = /* @__PURE__ */ createGlyph('audio', MusicalNoteIcon);
export const FilePdfGlyph = /* @__PURE__ */ createGlyph('file-pdf', NewspaperIcon);
export const FileArchiveGlyph = /* @__PURE__ */ createGlyph('file-archive', ArchiveBoxIcon);
export const FileTextGlyph = /* @__PURE__ */ createGlyph('file-text', DocumentTextIcon);
export const StarGlyph = /* @__PURE__ */ createGlyph('star', StarIcon);
export const AdjustmentsGlyph = /* @__PURE__ */ createGlyph(
  'adjustments',
  AdjustmentsHorizontalIcon,
);
export const MoveGlyph = /* @__PURE__ */ createGlyph('move', ArrowsUpDownIcon);
export const TableGlyph = /* @__PURE__ */ createGlyph('table', TableCellsIcon);
export const ResizeGlyph = /* @__PURE__ */ createGlyph('resize', ArrowsPointingOutIcon);
export const FormulaGlyph = /* @__PURE__ */ createGlyph('formula', VariableIcon);
export const PlayGlyph = /* @__PURE__ */ createGlyph('play', PlayIcon);
export const PauseGlyph = /* @__PURE__ */ createGlyph('pause', PauseIcon);
export const ParagraphGlyph = /* @__PURE__ */ createGlyph('paragraph', Bars3BottomLeftIcon);
export const BoldGlyph = /* @__PURE__ */ createGlyph('bold', BoldIcon);
export const ItalicGlyph = /* @__PURE__ */ createGlyph('italic', ItalicIcon);
export const UnderlineGlyph = /* @__PURE__ */ createGlyph('underline', UnderlineIcon);
export const StrikethroughGlyph = /* @__PURE__ */ createGlyph('strikethrough', StrikethroughIcon);
export const CodeGlyph = /* @__PURE__ */ createGlyph('code', CodeBracketIcon);
export const CodeBlockGlyph = /* @__PURE__ */ createGlyph('code-block', CodeBracketSquareIcon);
export const Heading1Glyph = /* @__PURE__ */ createGlyph('heading-1', H1Icon);
export const Heading2Glyph = /* @__PURE__ */ createGlyph('heading-2', H2Icon);
export const Heading3Glyph = /* @__PURE__ */ createGlyph('heading-3', H3Icon);
export const ListBulletGlyph = /* @__PURE__ */ createGlyph('list-bullet', ListBulletIcon);
export const ListNumberedGlyph = /* @__PURE__ */ createGlyph('list-numbered', NumberedListIcon);
export const ListTaskGlyph = /* @__PURE__ */ createGlyph('list-task', ClipboardDocumentCheckIcon);
export const QuoteGlyph = /* @__PURE__ */ createGlyph('quote', ChatBubbleBottomCenterTextIcon);
export const UnlinkGlyph = /* @__PURE__ */ createGlyph('unlink', LinkSlashIcon);
export const PendingGlyph = /* @__PURE__ */ createGlyph('pending', EllipsisHorizontalCircleIcon);
export const SkippedGlyph = /* @__PURE__ */ createGlyph('skipped', MinusCircleIcon);
export const HandRaisedGlyph = /* @__PURE__ */ createGlyph('hand-raised', HandRaisedIcon);
export const NoSymbolGlyph = /* @__PURE__ */ createGlyph('no-symbol', NoSymbolIcon);
export const XCircleGlyph = /* @__PURE__ */ createGlyph('x-circle', XCircleIcon);
export const ThumbsUpGlyph = /* @__PURE__ */ createGlyph('thumbs-up', HandThumbUpIcon);
export const ThumbsDownGlyph = /* @__PURE__ */ createGlyph('thumbs-down', HandThumbDownIcon);
export const ReplyGlyph = /* @__PURE__ */ createGlyph('reply', ArrowUturnLeftIcon);
export const BellSlashGlyph = /* @__PURE__ */ createGlyph('bell-slash', BellSlashIcon);
export const TerminalGlyph = /* @__PURE__ */ createGlyph('terminal', CommandLineIcon);
export const GlobeGlyph = /* @__PURE__ */ createGlyph('globe', GlobeAltIcon);
export const WrenchGlyph = /* @__PURE__ */ createGlyph('wrench', WrenchIcon);
export const SparklesGlyph = /* @__PURE__ */ createGlyph('sparkles', SparklesIcon);
