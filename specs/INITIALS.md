# Initials

`getInitials` turns a display name into the short text an avatar shows when it has no picture. `getLeadingLetter` picks the one letter a letter glyph shows for a name.

## UIC-INITIALS-1 - Initials from a name

### UIC-INITIALS-1.1 - Words

`getInitials(name)` shall return the first character of the first word and of the last word of a name with two or more words, otherwise the first two characters of the name, upper-cased. Leading, trailing and repeated whitespace is ignored. A blank name yields `?`.

Implementation: `src/utils/initials.ts`
Verification: `src/utils/initials.test.ts`

### UIC-INITIALS-1.2 - User-perceived characters

Characters shall be user-perceived characters (grapheme clusters), so an emoji sequence or a letter with a combining mark is taken whole. Where the runtime cannot segment text, whole code points are used.

Implementation: `src/utils/initials.ts`
Verification: `src/utils/initials.test.ts`

## UIC-INITIALS-2 - Leading letter

### UIC-INITIALS-2.1 - First letter or digit

`getLeadingLetter(name)` shall return the first user-perceived character of `name` that starts with a letter or a digit in any script, skipping leading whitespace, punctuation, symbols and emoji, upper-cased; a letter whose capital is more than one character, such as `ß`, keeps its own form. A name without a letter or a digit yields `undefined`.

Implementation: `src/utils/initials.ts`
Verification: `src/utils/initials.test.ts`
