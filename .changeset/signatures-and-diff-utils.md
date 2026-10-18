---
'@flamboyantengineer/ui-components': minor
---

Add signature components and text utilities.

- `SignaturePad`: a field for a signature drawn with a pointer as smoothed SVG strokes (Undo stroke, Clear) or typed as a name, with `allowsTyping`; values `DrawnSignature`, `TypedSignature` and `SignatureValue`; `formatSignatureSvg` and `formatSignatureDataUrl` turn a drawing into SVG markup or a `data:` URL.
- `SignatureDialog`: a modal that asks for the meaning of a signature, an optional reason and drawn signature, and the password (or user name and password) again, then calls an async `onSign`; types `SignatureMeaning`, `SignatureDetails`, `SignatureDialogCredentials` and `SignatureDialogEntry`.
- `diffLines` and `diffWords`: Myers line and word diffs returning typed hunks (`LineDiffHunk`, `WordDiffHunk`, `DiffKind`).
- `formatOutlineNumber`: hierarchical outline numbers (`1.2.3`) with per-level styles, a start and a separator.
- `createInlineWordDiff`: `InlineTextDiff` segments for every changed run of words, built on `diffWords`.
- `Form` takes a `ref` to its `<form>` element, so code outside it can call `requestSubmit()`.
- New provider strings: `signatureMethod`, `signatureDraw`, `signatureType`, `signatureTypePlaceholder`, `signatureStrokes`, `undoStroke`, `sign`, `signingAs`, `signatureMeaning`, `signatureReason`, `signature`, `userName`.

No breaking changes.
