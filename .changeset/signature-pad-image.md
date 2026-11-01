---
'@flamboyantengineer/ui-components': minor
---

`SignaturePad` adds an Image mode: the signer uploads or pastes an existing image of their signature (PNG, JPEG, WebP or GIF, at most `maxImageSize` bytes, 2 MB by default). The image becomes an `ImageSignature` value: a `data:` URL with its type and natural size, which serializes as JSON. A refused file shows why. The new `modes` prop (`draw`, `type`, `image`; all three by default) replaces `allowsTyping`: pass `modes={['draw']}` where `allowsTyping={false}` was used. Changing the mode still clears a signature given another way.
