'use client';

// Glyphs drawn for this library: document formatting, layout, table borders and file types
// (specs/PROVIDER.md, UIC-PROVIDER-2.1).

import { createGlyph } from './glyph-component.js';
import {
  abbreviationPath,
  alignBottomCenterPath,
  alignBottomLeftPath,
  alignBottomRightPath,
  alignMiddleCenterPath,
  alignMiddleLeftPath,
  alignMiddleRightPath,
  alignTopCenterPath,
  alignTopLeftPath,
  alignTopRightPath,
  articlePath,
  banknotePath,
  bars3BarPath,
  bars3CenterMiddlePath,
  borderAllPath,
  cellAlignmentPath,
  chatBubbleCheckPath,
  chatBubblePlusPath,
  chatBubbleTrashPath,
  chatBubbleXMarkPath,
  crossReferencePath,
  decreaseDecimalsPath,
  fileBadgeAudioPath,
  fileBadgeDataPath,
  fileBadgeDocumentPath,
  fileBadgeImagePath,
  fileBadgeSpreadsheetPath,
  fileBadgeVideoPath,
  fontFamilyPath,
  fontSizePath,
  footnotePath,
  fractionPath,
  increaseDecimalsPath,
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
  percentPath,
  rulerPath,
  scientificNotationPath,
  subscriptPath,
  superscriptPath,
  symbolPath,
  tableMergePath,
  tableOfContentsPath,
  tableUnmergePath,
  textAlignCenterPath,
  textAlignJustifyPath,
  textAlignLeftPath,
  textAlignRightPath,
  wrapTextPath,
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
export const TableBorderAllGlyph = /* @__PURE__ */ createGlyph('table-border-all', borderAllPath);
export const TableBorderBottomGlyph = /* @__PURE__ */ createGlyph(
  'table-border-bottom',
  borderBottomStrokes,
);
export const TableBorderLeftGlyph = /* @__PURE__ */ createGlyph(
  'table-border-left',
  borderLeftStrokes,
);
export const TableBorderNoneGlyph = /* @__PURE__ */ createGlyph(
  'table-border-none',
  borderNoneStrokes,
);
export const TableBorderOutsideGlyph = /* @__PURE__ */ createGlyph(
  'table-border-outside',
  borderOutsideStrokes,
);
export const TableBorderRightGlyph = /* @__PURE__ */ createGlyph(
  'table-border-right',
  borderRightStrokes,
);
export const TableBorderTopGlyph = /* @__PURE__ */ createGlyph(
  'table-border-top',
  borderTopStrokes,
);
export const MergeCellsGlyph = /* @__PURE__ */ createGlyph('merge-cells', tableMergePath);
export const UnmergeCellsGlyph = /* @__PURE__ */ createGlyph('unmerge-cells', tableUnmergePath);
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
export const TextAlignLeftGlyph = /* @__PURE__ */ createGlyph('text-align-left', textAlignLeftPath);
export const TextAlignCenterGlyph = /* @__PURE__ */ createGlyph(
  'text-align-center',
  textAlignCenterPath,
);
export const TextAlignRightGlyph = /* @__PURE__ */ createGlyph(
  'text-align-right',
  textAlignRightPath,
);
export const TextAlignJustifyGlyph = /* @__PURE__ */ createGlyph(
  'text-align-justify',
  textAlignJustifyPath,
);
export const FontFamilyGlyph = /* @__PURE__ */ createGlyph('font-family', fontFamilyPath);
export const FontSizeGlyph = /* @__PURE__ */ createGlyph('font-size', fontSizePath);
export const PercentGlyph = /* @__PURE__ */ createGlyph('percent', percentPath);
export const CurrencyGlyph = /* @__PURE__ */ createGlyph('currency', banknotePath);
export const ScientificNotationGlyph = /* @__PURE__ */ createGlyph(
  'scientific-notation',
  scientificNotationPath,
);
export const FractionGlyph = /* @__PURE__ */ createGlyph('fraction', fractionPath);
export const UnitGlyph = /* @__PURE__ */ createGlyph('unit', rulerPath);
export const IncreaseDecimalsGlyph = /* @__PURE__ */ createGlyph(
  'increase-decimals',
  increaseDecimalsPath,
);
export const DecreaseDecimalsGlyph = /* @__PURE__ */ createGlyph(
  'decrease-decimals',
  decreaseDecimalsPath,
);
export const CellAlignmentGlyph = /* @__PURE__ */ createGlyph('cell-alignment', cellAlignmentPath);
export const AlignTopLeftGlyph = /* @__PURE__ */ createGlyph('align-top-left', alignTopLeftPath);
export const AlignTopCenterGlyph = /* @__PURE__ */ createGlyph(
  'align-top-center',
  alignTopCenterPath,
);
export const AlignTopRightGlyph = /* @__PURE__ */ createGlyph('align-top-right', alignTopRightPath);
export const AlignMiddleLeftGlyph = /* @__PURE__ */ createGlyph(
  'align-middle-left',
  alignMiddleLeftPath,
);
export const AlignMiddleCenterGlyph = /* @__PURE__ */ createGlyph(
  'align-middle-center',
  alignMiddleCenterPath,
);
export const AlignMiddleRightGlyph = /* @__PURE__ */ createGlyph(
  'align-middle-right',
  alignMiddleRightPath,
);
export const AlignBottomLeftGlyph = /* @__PURE__ */ createGlyph(
  'align-bottom-left',
  alignBottomLeftPath,
);
export const AlignBottomCenterGlyph = /* @__PURE__ */ createGlyph(
  'align-bottom-center',
  alignBottomCenterPath,
);
export const AlignBottomRightGlyph = /* @__PURE__ */ createGlyph(
  'align-bottom-right',
  alignBottomRightPath,
);
export const WrapTextGlyph = /* @__PURE__ */ createGlyph('wrap-text', wrapTextPath);
