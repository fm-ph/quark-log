/**
 * Camel to kebab case.
 *
 * @param {String} str String.
 *
 * @returns {String} Parsed string.
 */
export function camelToKebab (str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Capitalize.
 *
 * @param {String} str String.
 *
 * @returns {String} Capitalized string.
 */
export function capitalize (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Check browser or Node environment.
 *
 * @returns {Boolean} True if running in browser, false otherwise.
 */
export function isBrowser () {
  return !(typeof process !== 'undefined' && process.title === 'node')
}
