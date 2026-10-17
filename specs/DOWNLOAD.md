# Download

Download utilities in `src/utils/download.ts`. They save a file the way a clicked download link does, without opening a window, navigating the page or rendering anything.

## UIC-DOWNLOAD-1 - Downloads

### UIC-DOWNLOAD-1.1 - Blob download

`downloadBlob` shall save a `Blob` under the given file name by clicking one hidden, temporary download link once, remove the link, and revoke the blob's object URL one second later (`DOWNLOAD_URL_LIFETIME`). It returns true, or false without a document.

Implementation: `src/utils/download.ts`
Verification: `src/utils/download.test.ts`

### UIC-DOWNLOAD-1.2 - URL download

`downloadUrl` shall download a same-origin URL, resolved against the page, or a `data:` URL, directly through a temporary download link, without creating an object URL or navigating. An empty file name lets the browser choose one. A cross-origin URL, whose file name browsers ignore, shall throw.

Implementation: `src/utils/download.ts`
Verification: `src/utils/download.test.ts`
