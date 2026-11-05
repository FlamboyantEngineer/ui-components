// `instanceof Date` holds only for dates of the script's own window, so it fails for one made in a
// same-origin frame or popup window. The built-in tag holds for a date of any window.

/** Whether a value is a `Date`, valid or not, from any window. */
export function isDate(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === '[object Date]';
}
