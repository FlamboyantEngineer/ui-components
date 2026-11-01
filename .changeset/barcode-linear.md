---
'@flamboyantengineer/ui-components': minor
---

Add `Barcode`, which draws Code 128, EAN-13, UPC-A and EAN-8 linear barcodes beside `QrCode`. It keeps the quiet zones each format requires, draws whole-pixel modules, can show the human-readable value, and names itself from the format and value. `encodeBarcode` checks the input, adds or verifies check digits, and reports why an invalid value has no symbol (`characters`, `length` or `checksum`). New provider strings: `barcodeOf` and `barcodeInvalid`.
