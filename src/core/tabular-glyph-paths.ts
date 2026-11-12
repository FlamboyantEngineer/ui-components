// Path data of the text alignment and tabular formatting glyphs, kept apart from `glyph-paths.ts`
// to hold each module to a readable size. Each path is its own export, so a bundle keeps only the
// glyphs it uses.

// Drawn for this library in the Heroicons outline style: text alignment as four lines, long and
// short in turn, set to the left, centre or right, or all long when justified; tabular formatting:
// text and number formats, decimal places, and a cell (a rounded square) holding two ragged text lines in each of
// its nine alignments, or the nine-dot alignment chooser.
export const textAlignLeftPath = 'M3.75 5.25h16.5M3.75 9.75h10.5M3.75 14.25h16.5M3.75 18.75h10.5';
export const textAlignCenterPath = 'M3.75 5.25h16.5M6.75 9.75h10.5M3.75 14.25h16.5M6.75 18.75h10.5';
export const textAlignRightPath = 'M3.75 5.25h16.5M9.75 9.75h10.5M3.75 14.25h16.5M9.75 18.75h10.5';
export const textAlignJustifyPath =
  'M3.75 5.25h16.5M3.75 9.75h16.5M3.75 14.25h16.5M3.75 18.75h16.5';
export const fontFamilyPath =
  'M3.75 19.5 8.25 4.5l4.5 15M5.33 14.25h5.84M2.25 19.5h3M11.25 19.5h3M15.75 8.25h4.5M15.75 12h4.5M15.75 15.75h4.5';
export const fontSizePath = 'M3 5.25h10.5M8.25 5.25V19.5M14.25 11.25H21M17.625 11.25v8.25';
export const percentPath =
  'M18.75 5.25 5.25 18.75M4.875 7.125a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 1 0-4.5 0M14.625 16.875a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 1 0-4.5 0';
export const banknotePath =
  'M2.25 6.75h19.5v10.5H2.25ZM14.25 12a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0ZM5.25 9.75v4.5M18.75 9.75v4.5';
export const scientificNotationPath =
  'M4.5 9.75 6.75 7.5v11.25M9 13.125a2.25 5.625 0 1 0 4.5 0 2.25 5.625 0 1 0-4.5 0M15.75 4.5l4.5 4.5M20.25 4.5l-4.5 4.5';
export const fractionPath =
  'M4.875 5.25 6.75 3.75v6.75M18 4.5 6 19.5M14.25 15.375a2.25 2.25 0 1 1 3.9 1.5l-3.9 3.375h4.5';
export const rulerPath =
  'M2.25 8.25h19.5v7.5H2.25ZM6 8.25V12M9 8.25v2.25M12 8.25V12M15 8.25v2.25M18 8.25V12';
export const increaseDecimalsPath =
  'M6.75 5.25H18m0 0-2.25-2.25M18 5.25l-2.25 2.25M6.75 15a2.25 3.75 0 1 0 4.5 0 2.25 3.75 0 1 0-4.5 0M14.25 15a2.25 3.75 0 1 0 4.5 0 2.25 3.75 0 1 0-4.5 0M4.8 18.75a.3.3 0 1 1-.6 0 .3.3 0 1 1 .6 0';
export const decreaseDecimalsPath =
  'M18 5.25H6.75m0 0L9 3M6.75 5.25 9 7.5M11.25 15a2.25 3.75 0 1 0 4.5 0 2.25 3.75 0 1 0-4.5 0M9.3 18.75a.3.3 0 1 1-.6 0 .3.3 0 1 1 .6 0';
export const wrapTextPath =
  'M3.75 6h16.5M3.75 12h12.75a3 3 0 1 1 0 6H12m0 0 2.25-2.25M12 18l2.25 2.25M3.75 18h4.5';
export const alignTopLeftPath =
  'M5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5ZM6.75 7.5h7.5M6.75 10.5h4.5';
export const alignTopCenterPath =
  'M5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5ZM8.25 7.5h7.5M9.75 10.5h4.5';
export const alignTopRightPath =
  'M5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5ZM9.75 7.5h7.5M12.75 10.5h4.5';
export const alignMiddleLeftPath =
  'M5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5ZM6.75 10.5h7.5M6.75 13.5h4.5';
export const alignMiddleCenterPath =
  'M5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5ZM8.25 10.5h7.5M9.75 13.5h4.5';
export const alignMiddleRightPath =
  'M5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5ZM9.75 10.5h7.5M12.75 13.5h4.5';
export const alignBottomLeftPath =
  'M5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5ZM6.75 13.5h7.5M6.75 16.5h4.5';
export const alignBottomCenterPath =
  'M5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5ZM8.25 13.5h7.5M9.75 16.5h4.5';
export const alignBottomRightPath =
  'M5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5ZM9.75 13.5h7.5M12.75 16.5h4.5';
export const cellAlignmentPath =
  'M5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5ZM8.25 7.5a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M12.75 7.5a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M17.25 7.5a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M8.25 12a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M17.25 12a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M8.25 16.5a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M12.75 16.5a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0M17.25 16.5a.75.75 0 1 1-1.5 0 .75.75 0 1 1 1.5 0';

// Text colour and size, drawn for this library in the same style: `fontColorPath` is a capital A
// and `backgroundColorPath` a tipped paint bucket with a falling drop, both kept above a 4.5 pixel
// band at the bottom of the box, where a colour button draws its swatch bar; the font size steps
// pair a capital A with an arrow pointing up or down.
export const fontColorPath = 'M6.75 16.5 12 3.75l5.25 12.75M8.6 12h6.8';
export const backgroundColorPath =
  'M6.75 2.25l4.5 4.5M10.5 4.5l6.75 6.75-6.75 6.75-6.75-6.75 6.75-6.75ZM3.75 11.25h13.5M20.25 13.5s-1.5 1.8-1.5 2.85a1.5 1.5 0 0 0 3 0c0-1.05-1.5-2.85-1.5-2.85Z';
export const increaseFontSizePath =
  'M3 19.5 8.25 6l5.25 13.5M5.04 14.25h6.42M18 15V6m0 0-3 3m3-3 3 3';
export const decreaseFontSizePath =
  'M3 19.5 8.25 6l5.25 13.5M5.04 14.25h6.42M18 6v9m0 0-3-3m3 3 3-3';
