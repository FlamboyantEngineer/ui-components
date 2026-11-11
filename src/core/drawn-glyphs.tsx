'use client';

// Glyphs drawn for this library: document formatting, layout, table borders and file types
// (specs/PROVIDER.md, UIC-PROVIDER-2.1).

import { createGlyph } from './glyph-component.js';
import {
  abbreviationPath,
  articlePath,
  bars3BarPath,
  bars3CenterMiddlePath,
  borderAllPath,
  chatBubbleCheckPath,
  chatBubblePlusPath,
  chatBubbleTrashPath,
  chatBubbleXMarkPath,
  crossReferencePath,
  fileBadgeAudioPath,
  fileBadgeDataPath,
  fileBadgeDocumentPath,
  fileBadgeImagePath,
  fileBadgeSpreadsheetPath,
  fileBadgeVideoPath,
  footnotePath,
  layoutAddBelowPath,
  layoutHalvesPath,
  layoutSinglePath,
  layoutThirdsPath,
  layoutThirdTwoThirdsPath,
  layoutTwoThirdsThirdPath,
  libraryPath,
  pageBreakPath,
  pageFitHeightPath,
  pageLandscapePath,
  pagePortraitPath,
  subscriptPath,
  superscriptPath,
  symbolPath,
  tableMergePath,
  tableOfContentsPath,
  tableUnmergePath,
} from './glyph-paths.js';
import {
  borderBottomStrokes,
  borderLeftStrokes,
  borderNoneStrokes,
  borderOutsideStrokes,
  borderRightStrokes,
  borderTopStrokes,
} from './glyph-strokes.js';

export const ArticleGlyph = /* @__PURE__ */ createGlyph('article', articlePath);
export const Bars3BarGlyph = /* @__PURE__ */ createGlyph('bars-3-bar', bars3BarPath);
export const Bars3CenterMiddleGlyph = /* @__PURE__ */ createGlyph(
  'bars-3-center-middle',
  bars3CenterMiddlePath,
);
export const ChatBubbleCheckGlyph = /* @__PURE__ */ createGlyph(
  'chat-bubble-check',
  chatBubbleCheckPath,
);
export const ChatBubblePlusGlyph = /* @__PURE__ */ createGlyph(
  'chat-bubble-plus',
  chatBubblePlusPath,
);
export const ChatBubbleTrashGlyph = /* @__PURE__ */ createGlyph(
  'chat-bubble-trash',
  chatBubbleTrashPath,
);
export const ChatBubbleXMarkGlyph = /* @__PURE__ */ createGlyph(
  'chat-bubble-x-mark',
  chatBubbleXMarkPath,
);
export const LayoutAddBelowGlyph = /* @__PURE__ */ createGlyph(
  'layout-add-below',
  layoutAddBelowPath,
);
export const LayoutHalvesGlyph = /* @__PURE__ */ createGlyph('layout-halves', layoutHalvesPath);
export const LayoutSingleGlyph = /* @__PURE__ */ createGlyph('layout-single', layoutSinglePath);
export const LayoutThirdTwoThirdsGlyph = /* @__PURE__ */ createGlyph(
  'layout-third-two-thirds',
  layoutThirdTwoThirdsPath,
);
export const LayoutThirdsGlyph = /* @__PURE__ */ createGlyph('layout-thirds', layoutThirdsPath);
export const LayoutTwoThirdsThirdGlyph = /* @__PURE__ */ createGlyph(
  'layout-two-thirds-third',
  layoutTwoThirdsThirdPath,
);
export const LibraryGlyph = /* @__PURE__ */ createGlyph('library', libraryPath);
export const FitHeightGlyph = /* @__PURE__ */ createGlyph('fit-height', pageFitHeightPath);
export const PageLandscapeGlyph = /* @__PURE__ */ createGlyph('page-landscape', pageLandscapePath);
export const PagePortraitGlyph = /* @__PURE__ */ createGlyph('page-portrait', pagePortraitPath);
export const SuperscriptGlyph = /* @__PURE__ */ createGlyph('superscript', superscriptPath);
export const SubscriptGlyph = /* @__PURE__ */ createGlyph('subscript', subscriptPath);
export const SpecialCharacterGlyph = /* @__PURE__ */ createGlyph('special-character', symbolPath);
export const FootnoteGlyph = /* @__PURE__ */ createGlyph('footnote', footnotePath);
export const CrossReferenceGlyph = /* @__PURE__ */ createGlyph(
  'cross-reference',
  crossReferencePath,
);
export const AbbreviationGlyph = /* @__PURE__ */ createGlyph('abbreviation', abbreviationPath);
export const PageBreakGlyph = /* @__PURE__ */ createGlyph('page-break', pageBreakPath);
export const TableOfContentsGlyph = /* @__PURE__ */ createGlyph(
  'table-of-contents',
  tableOfContentsPath,
);
export const BorderAllGlyph = /* @__PURE__ */ createGlyph('border-all', borderAllPath);
export const BorderBottomGlyph = /* @__PURE__ */ createGlyph('border-bottom', borderBottomStrokes);
export const BorderLeftGlyph = /* @__PURE__ */ createGlyph('border-left', borderLeftStrokes);
export const BorderNoneGlyph = /* @__PURE__ */ createGlyph('border-none', borderNoneStrokes);
export const BorderOutsideGlyph = /* @__PURE__ */ createGlyph(
  'border-outside',
  borderOutsideStrokes,
);
export const BorderRightGlyph = /* @__PURE__ */ createGlyph('border-right', borderRightStrokes);
export const BorderTopGlyph = /* @__PURE__ */ createGlyph('border-top', borderTopStrokes);
export const MergeCellsGlyph = /* @__PURE__ */ createGlyph('merge-cells', tableMergePath);
export const SplitCellsGlyph = /* @__PURE__ */ createGlyph('split-cells', tableUnmergePath);
export const FileImageGlyph = /* @__PURE__ */ createGlyph('file-image', fileBadgeImagePath);
export const FileVideoGlyph = /* @__PURE__ */ createGlyph('file-video', fileBadgeVideoPath);
export const FileAudioGlyph = /* @__PURE__ */ createGlyph('file-audio', fileBadgeAudioPath);
export const FileDocumentGlyph = /* @__PURE__ */ createGlyph(
  'file-document',
  fileBadgeDocumentPath,
);
export const FileDataGlyph = /* @__PURE__ */ createGlyph('file-data', fileBadgeDataPath);
export const FileSpreadsheetGlyph = /* @__PURE__ */ createGlyph(
  'file-spreadsheet',
  fileBadgeSpreadsheetPath,
);
