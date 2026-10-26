/** How long an object URL stays valid after its download starts, in milliseconds. */
export declare const DOWNLOAD_URL_LIFETIME = 1000;
/**
 * Saves `blob` as `fileName`. The object URL is revoked shortly after the download starts.
 * Returns false when there is no document to start a download from.
 */
export declare function downloadBlob(blob: Blob, fileName: string): boolean;
/**
 * Downloads a same-origin URL (relative URLs resolve against the page) or a `data:` URL directly,
 * without buffering it. Browsers ignore the file name of cross-origin links and navigate instead,
 * so a cross-origin URL throws. An empty `fileName` lets the browser choose the name.
 * Returns false when there is no document to start a download from.
 */
export declare function downloadUrl(url: string | URL, fileName?: string): boolean;
//# sourceMappingURL=download.d.ts.map