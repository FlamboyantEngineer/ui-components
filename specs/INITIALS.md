# Initials

`getInitials` turns a display name into the short text an avatar shows when it has no picture.

## UIC-INITIALS-1 - Initials from a name

### UIC-INITIALS-1.1 - Words

`getInitials(name)` shall return the first character of the first word and of the last word of a name with two or more words, otherwise the first two characters of the name, upper-cased. Leading, trailing and repeated whitespace is ignored. A blank name yields `?`.

Implementation: `src/utils/initials.ts`
Verification: `src/utils/initials.test.ts`

### UIC-INITIALS-1.2 - User-perceived characters

Characters shall be user-perceived characters (grapheme clusters), so an emoji sequence or a letter with a combining mark is taken whole. Where the runtime cannot segment text, whole code points are used.

Implementation: `src/utils/initials.ts`
Verification: `src/utils/initials.test.ts`
