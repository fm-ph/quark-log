import { capitalize as cap } from '../utils'

/**
 * Namespace plugin.
 *
 * @param {String} msgs Messages.
 * @param {Object} [options={}] Plugin options.
 * @param {String} [options.name=null] Namespace name.
 * @param {Boolean} [options.capitalize=false] Capitalize.
 * @param {Object} [options.styles={}] Plugin styles.
 * @param {Object} level Level.
 * @param {String} level.name Level name.
 * @param {Object} level.options Level options.
 *
 * @returns {Object} Plugin result.
 */
export default function namespace (msgs, { name = null, capitalize = false, styles = {} }, level) {
  let formattedMsg = ''
  let s = {}

  if (name) {
    if (capitalize) {
      name = cap(name)
    }
    formattedMsg = `[${name}]`

    s = {
      ...defaultStyles,
      ...levelStyles[level.name],
      ...styles || {}
    }
  }

  return { before: formattedMsg, styles: s }
}

const defaultStyles = {
  color: 'white',
  background: '#000000',
  padding: '3px 5px'
}

const levelStyles = {
  log: {
    background: '#000000'
  },
  info: {
    background: '#219bff'
  },
  warn: {
    background: '#ffea2d',
    color: 'inherit'
  },
  error: {
    background: '#e52d34'
  }
}
