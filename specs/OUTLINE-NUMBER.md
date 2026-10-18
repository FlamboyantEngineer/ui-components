# Outline Number

`formatOutlineNumber` writes the hierarchical number of an item in an outline, a tree or a document (`1`, `1.2`, `1.2.3`) from its position at each level. Specifications, requirement lists and nested sections number their items this way; a host calls it while rendering each row or heading.

## UIC-OUTLINE-NUMBER-1 - Formatting

### UIC-OUTLINE-NUMBER-1.1 - Path to number

`formatOutlineNumber(path)` shall take the item's zero-based position among its siblings at each level, from the top, and write one number per level, counted from 1 and joined with `.`, so `[0, 1, 2]` gives `1.2.3`. An empty path gives an empty text. Positions are read as whole numbers of at least zero.

Implementation: `src/utils/outline-number.ts`
Verification: `src/utils/outline-number.test.ts`

### UIC-OUTLINE-NUMBER-1.2 - Styles

`styles` shall set the style of each level from the top, the last style repeating for deeper levels (`['decimal']` by default): `decimal`, `lower-alpha` and `upper-alpha` (a to z, then aa, ab and on), and `lower-roman` and `upper-roman` (up to 3999). A level whose number its style cannot write (below 1 for letters and numerals, above 3999 for numerals) is written in decimal.

Implementation: `src/utils/outline-number.ts`
Verification: `src/utils/outline-number.test.ts`

### UIC-OUTLINE-NUMBER-1.3 - Start and separator

`start` shall set the number the first item of every level gets (1 by default, 0 for a zero-based outline), and `separator` the text written between levels (`.` by default).

Implementation: `src/utils/outline-number.ts`
Verification: `src/utils/outline-number.test.ts`
