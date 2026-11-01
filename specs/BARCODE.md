# Barcode

`Barcode` draws a value as a linear barcode, beside [QR Code](QR-CODE.md): an SVG image of the symbol's bars between light quiet zones, named for assistive technology, with the human-readable value under it on request. It supports Code 128, for any short ASCII text, and the retail formats EAN-13, UPC-A and EAN-8, for digits with a check digit. The bars come from `encodeBarcode`, a pure encoder in the library that a host can also call to draw symbols its own way. The component never writes a colour: unstyled, the bars are black on the page's ground, and the host stylesheet colours the bars and the ground behind them.

## UIC-BARCODE-1 - Encoder

### UIC-BARCODE-1.1 - Result

`encodeBarcode(value, format)` shall return `{ symbol }` for a value the format holds, where `symbol` is `{ format, text, modules, quietZone }`: `text` is the human-readable value (the text, or the digits with their check digit), `modules` lists the modules from the first bar to the last with `true` for a bar and no quiet zone, and `quietZone` gives the light modules the format requires before and after the bars. For any other value it shall return `{ invalid }` with the reason: `characters` (a character the format cannot hold), `length` (a length it does not take) or `checksum` (a check digit that does not match). It never throws.

Implementation: `src/components/barcode/encode-barcode.ts`
Verification: `src/components/barcode/encode-barcode.test.ts`

### UIC-BARCODE-1.2 - Code 128

`code128` shall take 1 to 80 ASCII characters (code points 0 to 127), control characters included; an empty or longer value is `length`, and any other character is `characters` (extended characters through FNC4 are left out, as readers differ on them). The encoder starts in code set C when the value is two or more digits and nothing else, or begins with four digits, and otherwise in A or B, whichever holds the first control character or lower-case letter ahead (B when there is neither). It switches to C for a run of four digits at the end or six in the middle, encoding one digit first when the run is odd, and between A and B as characters need. It adds the modulo 103 check symbol (the start value plus each symbol value times its position) and the stop pattern. Each symbol is 11 modules wide, three bars and three spaces of one to four modules; the stop is 13. The quiet zone is 10 modules on each side, and `text` is the value as given.

Implementation: `src/components/barcode/code-128.ts`, `src/components/barcode/encode-barcode.ts`
Verification: `src/components/barcode/encode-barcode.test.ts`

### UIC-BARCODE-1.3 - EAN-13, UPC-A and EAN-8

`ean13`, `upca` and `ean8` shall take digits only (anything else is `characters`): 12, 11 and 7 digits get their check digit added, and 13, 12 and 8 digits keep theirs, which must equal the one computed from the others (`checksum` when it does not); any other length is `length`. The check digit weights the digits 3 and 1 alternately from the rightmost, and makes the weighted sum a multiple of ten. The symbol is a start guard (`101`), the left half in odd and even parity sets (for EAN-13, the sets that encode its first digit; for EAN-8, all odd), a centre guard (`01010`), the right half, and an end guard: 95 modules for EAN-13 and UPC-A, 67 for EAN-8. A UPC-A symbol is the EAN-13 symbol of its digits after a leading `0`. The quiet zones are 11 and 7 modules for EAN-13, 9 and 9 for UPC-A, and 7 and 7 for EAN-8.

Implementation: `src/components/barcode/ean.ts`, `src/components/barcode/encode-barcode.ts`
Verification: `src/components/barcode/encode-barcode.test.ts`

### UIC-BARCODE-1.4 - Standard vectors

The encoder's symbols shall match the standards' published examples (EAN-13 `4006381333931`, UPC-A `036000291452`, EAN-8 `96385074`, and the Code 128 symbol values of `Wikipedia`, check symbol 88), and its test vectors record symbols that an independent reader (ZXing) decoded to their `text`.

Implementation: `src/components/barcode/encode-barcode.ts`
Verification: `src/components/barcode/encode-barcode.test.ts`

## UIC-BARCODE-2 - Drawing

### UIC-BARCODE-2.1 - Bars and quiet zones

`Barcode` shall render a `ui-barcode` root holding an `<svg>` (`ui-barcode__symbol`) whose `viewBox` measures one unit per module across and one unit down, with `preserveAspectRatio="none"`, and draw the bars as one `<path>` (`ui-barcode__bars`), one rectangle per bar, with crisp edges. The quiet zones are `quietZone` light modules on each side (a whole number), never fewer than the format requires. The `<svg>`'s `width` is the modules across times `moduleWidth`, a whole number of pixels from 1 (2 by default), so every module covers the same whole pixels; its `height` is `height` pixels (64 by default). A host stylesheet that sizes the symbol otherwise keeps the bars in proportion across, since every module scales alike. The value is encoded again only when `value` or `format` changes.

Implementation: `src/components/barcode/barcode.tsx`, `labs/reference/barcode.css`
Verification: `src/components/barcode/barcode.test.tsx`, `e2e/barcode.spec.ts`

### UIC-BARCODE-2.2 - Format

`format` (`code128` by default, `ean13`, `upca` or `ean8`) shall choose the symbology and publish `data-format`.

Implementation: `src/components/barcode/barcode.tsx`
Verification: `src/components/barcode/barcode.test.tsx`, `e2e/barcode.spec.ts`

### UIC-BARCODE-2.3 - Human-readable value

With `showValue`, the root shall hold the symbol's `text` in a `ui-barcode__value` span after the `<svg>`: the value as given, or the digits with their check digit. It is part of the image, so it adds nothing to the accessible name.

Implementation: `src/components/barcode/barcode.tsx`, `labs/reference/barcode.css`
Verification: `src/components/barcode/barcode.test.tsx`, `e2e/barcode.spec.ts`

### UIC-BARCODE-2.4 - Invalid value

When the format cannot hold `value`, `Barcode` shall draw no symbol and no value, publish the reason in `data-invalid` (`characters`, `length` or `checksum`), and be named by the provider's `barcodeInvalid` string with the format's name unless the caller names it.

Implementation: `src/components/barcode/barcode.tsx`, `src/core/strings/presentation.ts`
Verification: `src/components/barcode/barcode.test.tsx`, `e2e/barcode.spec.ts`

## UIC-BARCODE-3 - Accessibility and hooks

### UIC-BARCODE-3.1 - Accessible name

`Barcode` shall render `role="img"` named by `aria-label`, by the element `aria-labelledby` points to, or else by the provider's `barcodeOf` string with the format's name (`Code 128`, `EAN-13`, `UPC-A`, `EAN-8`, the same in every language) and the human-readable value (`EAN-13 barcode: 4006381333931`), so a reader who cannot scan it still learns what it holds. Its `<svg>` is hidden from assistive technology, and it is not focusable.

Implementation: `src/components/barcode/barcode.tsx`, `src/core/strings/presentation.ts`
Verification: `src/components/barcode/barcode.test.tsx`, `e2e/barcode.spec.ts`

### UIC-BARCODE-3.2 - Hooks and caller attributes

`Barcode` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its root.

Implementation: `src/components/barcode/barcode.tsx`
Verification: `src/components/barcode/barcode.test.tsx`

## Hooks

| Hook                 | Kind      | Values                             | Description                                               |
| -------------------- | --------- | ---------------------------------- | --------------------------------------------------------- |
| `ui-barcode`         | root      |                                    | The image: the symbol and the human-readable value.       |
| `ui-barcode__symbol` | slot      |                                    | The `<svg>`; its background is the light ground.          |
| `ui-barcode__bars`   | slot      |                                    | The `<path>` of the bars.                                 |
| `ui-barcode__value`  | slot      |                                    | The human-readable value under the bars.                  |
| `data-format`        | attribute | `code128`, `ean13`, `upca`, `ean8` | The symbology.                                            |
| `data-invalid`       | state     | `characters`, `length`, `checksum` | Why the format cannot hold the value; no symbol is drawn. |
