// Saving a file as a clicked download link would, without opening a window or navigating.
/** How long an object URL stays valid after its download starts, in milliseconds. */
export const DOWNLOAD_URL_LIFETIME = 1000;
function clickDownloadLink(href, fileName) {
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    link.rel = 'noopener';
    link.hidden = true;
    document.body.append(link);
    try {
        link.click();
    }
    finally {
        link.remove();
    }
}
function canDownload() {
    return typeof document !== 'undefined' && Boolean(document.body);
}
/**
 * Saves `blob` as `fileName`. The object URL is revoked shortly after the download starts.
 * Returns false when there is no document to start a download from.
 */
export function downloadBlob(blob, fileName) {
    if (!canDownload())
        return false;
    const url = URL.createObjectURL(blob);
    clickDownloadLink(url, fileName);
    setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME);
    return true;
}
/**
 * Downloads a same-origin URL (relative URLs resolve against the page) or a `data:` URL directly,
 * without buffering it. Browsers ignore the file name of cross-origin links and navigate instead,
 * so a cross-origin URL throws. An empty `fileName` lets the browser choose the name.
 * Returns false when there is no document to start a download from.
 */
export function downloadUrl(url, fileName = '') {
    if (!canDownload())
        return false;
    const resolved = new URL(url, document.baseURI);
    if (resolved.protocol !== 'data:' && resolved.origin !== new URL(document.baseURI).origin) {
        throw new Error('Download URL must have the same origin as the page.');
    }
    clickDownloadLink(resolved.href, fileName);
    return true;
}
//# sourceMappingURL=download.js.map