---
'@flamboyantengineer/ui-components': patch
---

The lab server, `npm run labs` and the browser tests share one address, with `LABS_PORT` choosing the port (the server no longer reads `PORT`). The server serves WebAssembly, fonts, icons and modern image formats with their own content types, extensionless files as plain text, and refuses unknown types instead of guessing.
