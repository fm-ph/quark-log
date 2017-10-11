const pad = num => ('0' + num).slice(-2)

/**
 * Time plugin.
 *
 * @param {String} msgs Messages.
 * @param {Object} options Plugins options.
 * @param {Object} level Level.
 * @param {String} level.name Level name.
 * @param {Object} level.options Level options.
 *
 * @returns {Object} Plugin result.
 */
export default function time (msgs, options, level) {
  const date = new Date()

  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  const time = `${hours}:${minutes}:${seconds}`

  const formattedMsg = `[${time}]`

  return { before: formattedMsg }
}
