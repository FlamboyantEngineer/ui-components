// `instanceof URL` holds only for URLs of the script's own window, so it fails for one made in a
// same-origin frame or popup window. The built-in tag holds for a URL of any window.

/** Whether a value is a `URL`, from any window. */
export function isUrl(value: unknown): value is URL {
  return Object.prototype.toString.call(value) === '[object URL]';
}
