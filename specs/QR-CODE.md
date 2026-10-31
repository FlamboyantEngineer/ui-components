# QR Code

`QrCode` draws text, usually a URL, as a QR code: an SVG image of the symbol's dark modules inside a light quiet zone, named for assistive technology. The symbol comes from `encodeQr`, a pure encoder in the library (byte mode, versions 1 to 40, Reed–Solomon error correction and masking) that a host can also call to draw symbols its own way. The code never writes a colour: unstyled, the modules are black on the page's ground, and the host stylesheet colours the modules and the ground behind them.

## UIC-QR-CODE-1 - Encoder

### UIC-QR-CODE-1.1 - Byte mode and version

`encodeQr(text, { errorCorrection })` shall encode `text` as its UTF-8 bytes in one byte-mode segment (mode indicator, a character count of 8 bits up to version 9 and 16 bits from version 10, the bytes, a terminator of up to four zero bits, zero bits to a whole codeword, then the alternating pad codewords `0xEC` and `0x11`), in the smallest version from 1 to 40 that holds them at the error correction level, which defaults to `medium`. It returns `{ version, errorCorrection, mask, size, modules }`, where `size` is `version × 4 + 17` and `modules` holds the rows of the symbol, top to bottom, with `true` for a dark module and no quiet zone. Text too long for version 40 at that level returns `undefined`.

Implementation: `src/utils/encode-qr.ts`, `src/utils/qr-codewords.ts`
Verification: `src/utils/encode-qr.test.ts`, `src/utils/qr-codewords.test.ts`

### UIC-QR-CODE-1.2 - Error correction

The error correction level shall be `low`, `medium`, `quartile` or `high` (about 7, 15, 25 and 30 percent of the symbol recoverable). The data codewords are split into the blocks the standard sets for the version and level, each block gets its Reed–Solomon error correction codewords over GF(2^8) with the polynomial `0x11D`, and the final sequence interleaves the data codewords block by block, then the error correction codewords.

Implementation: `src/utils/qr-codewords.ts`, `src/utils/qr-reed-solomon.ts`
Verification: `src/utils/qr-reed-solomon.test.ts`, `src/utils/qr-codewords.test.ts`, `src/utils/encode-qr.test.ts`

### UIC-QR-CODE-1.3 - Patterns, placement and mask

The encoder shall draw the finder patterns with their separators, the timing patterns, the alignment patterns, the dark module, the format information (level and mask with their BCH code, in both copies) and, from version 7, the version information; place the codeword bits in two-module columns from the lower right corner, alternately upward and downward, skipping function modules; and apply the one of the eight masks whose symbol scores the lowest penalty (runs of five or more modules of one colour, 2 × 2 blocks of one colour, finder-like patterns with the quiet zone counted as light, and the dark share away from one half), the first mask winning a tie. The result matches a reference encoder module for module.

Implementation: `src/utils/encode-qr.ts`, `src/utils/qr-matrix.ts`, `src/utils/qr-penalty.ts`
Verification: `src/utils/encode-qr.test.ts`

## UIC-QR-CODE-2 - Drawing

### UIC-QR-CODE-2.1 - Symbol and quiet zone

`QrCode` shall render an `<svg>` whose `viewBox` measures one unit per module, the symbol plus `quietZone` light modules on every side (a whole number, 4 by default, the margin readers expect), and draw the dark modules as one `<path>` in the `ui-qr-code__modules` slot, one rectangle per horizontal run, with crisp edges. Its `width` and `height` are the modules across times `moduleSize` pixels (4 by default); the host stylesheet may size it otherwise. The code is encoded again only when `value` or `errorCorrection` changes.

Implementation: `src/components/qr-code/qr-code.tsx`
Verification: `src/components/qr-code/qr-code.test.tsx`, `e2e/qr-code.spec.ts`

### UIC-QR-CODE-2.2 - Error correction and version

`errorCorrection` (`low`, `medium` by default, `quartile` or `high`) shall choose the level and publish `data-error-correction`; the root publishes the symbol's version in `data-version`, so a stylesheet or a test can tell how dense the code is.

Implementation: `src/components/qr-code/qr-code.tsx`
Verification: `src/components/qr-code/qr-code.test.tsx`, `e2e/qr-code.spec.ts`

### UIC-QR-CODE-2.3 - Text too long

When `value` does not fit in version 40 at the level, `QrCode` shall draw no modules, carry `data-invalid`, and be named by the provider's `qrCodeTooLong` string unless the caller names it.

Implementation: `src/components/qr-code/qr-code.tsx`, `src/core/strings/presentation.ts`
Verification: `src/components/qr-code/qr-code.test.tsx`

## UIC-QR-CODE-3 - Accessibility and hooks

### UIC-QR-CODE-3.1 - Accessible name

`QrCode` shall render `role="img"` named by `aria-label`, by the element `aria-labelledby` points to, or else by the provider's `qrCodeOf` string with the encoded text (`QR code: https://example.com`), so a reader who cannot scan it still learns what it holds. It is not focusable.

Implementation: `src/components/qr-code/qr-code.tsx`, `src/core/strings/presentation.ts`
Verification: `src/components/qr-code/qr-code.test.tsx`, `e2e/qr-code.spec.ts`

### UIC-QR-CODE-3.2 - Hooks and caller attributes

`QrCode` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its `<svg>`.

Implementation: `src/components/qr-code/qr-code.tsx`
Verification: `src/components/qr-code/qr-code.test.tsx`

## Hooks

| Hook                    | Kind      | Values                              | Description                                      |
| ----------------------- | --------- | ----------------------------------- | ------------------------------------------------ |
| `ui-qr-code`            | root      |                                     | The `<svg>`; its background is the light ground. |
| `ui-qr-code__modules`   | slot      |                                     | The `<path>` of the dark modules.                |
| `data-error-correction` | attribute | `low`, `medium`, `quartile`, `high` | The error correction level.                      |
| `data-version`          | state     |                                     | The symbol's version, from `1` to `40`.          |
| `data-invalid`          | state     | `true`                              | The text is too long for a QR code.              |
