# Require Defined

`requireDefined` returns a value an invariant guarantees is present, such as an array item at an index inside its bounds, so library code narrows it without a non-null assertion (`docs/CODING-GUIDELINES.md` TS3).

## UIC-REQUIRE-DEFINED-1 - Presence

### UIC-REQUIRE-DEFINED-1.1 - Present or thrown

`requireDefined(value)` shall return `value` unchanged when it is neither `undefined` nor `null`, including falsy values such as `0`, `''` and `false`, and shall throw an `Error` when it is `undefined` or `null`.

Implementation: `src/utils/require-defined.ts`
Verification: `src/utils/require-defined.test.ts`
