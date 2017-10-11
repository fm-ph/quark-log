import { camelToKebab } from './utils'

/**
 * Logger class.
 *
 * @class
 * @license https://opensource.org/licenses/MIT
 * @author Patrick Heng & Fabien Motte <hengpatrick.pro@gmail.com/contact@fabienmotte.com>
 *
 * @example
 * const logger = new Logger()
 * logger.log('Test')
 */
class Logger {
  /**
   * Creates an instance of Logger.
   *
   * @constructor
   */
  constructor () {
    this._enabled = true
    this._defaultsLevels = { log: {}, info: {}, warn: {}, error: {} }
    this._levels = { log: {}, info: {}, warn: {}, error: {} }
    this._commands = ['group', 'time']
    this._plugins = {}
    this._logHandler = null

    this._bindLevels()
    this._bindCommands()
  }

  /**
   * Enable logging.
   *
   * @returns {Logger} `this`
   */
  on () {
    this._enabled = true
    return this
  }

  /**
   * Disable logging.
   *
   * @returns {Logger} `this`
   */
  off () {
    this._enabled = false
    return this
  }

  /**
   * Reset levels and plugins.
   */
  reset () {
    this._levels = { log: {}, info: {}, warn: {}, error: {} }
    this._plugins = {}
    this._bindLevels()
  }

  /**
   * Add/modify a level.
   *
   * @param {String} name Level name.
   * @param {Object} [options={}] Level options.
   *
   * @returns {Logger} `this`
   */
  level (name, options = {}) {
    if (typeof name !== 'string') {
      return this._printError(`Logger.level() : 'name' argument is required`)
    }

    if (typeof this._levels[name] !== 'undefined') { // Modify existing level options
      this._levels[name] = {
        ...this._levels[name],
        ...options
      }
    } else { // Add a new level
      this._levels[name] = options
    }
    this._bindLevel(name, options)

    return this
  }

  /**
   * Add/modify a plugin.
   *
   * @param {String} name Plugin name.
   * @param {Function|Object} fn Plugin callback function/plugin options if plugin already exists.
   * @param {Object} [options={}] Plugin options.
   *
   * @returns {Logger} `this`
   */
  plugin (name, fn, options = {}) {
    if (typeof name !== 'string') {
      return this._printError(`Logger.plugin() : 'name' argument is required`)
    }

    if (typeof this._plugins[name] !== 'undefined' && typeof fn === 'object' && fn !== null) {  // Modify existing plugin options
      this._plugins[name].options = {
        ...this._plugins[name].options,
        ...fn
      }
      return this
    } else if (typeof fn !== 'function') {
      return this._printError(`Logger.plugin() : 'fn' argument must be a function`)
    }

    this._plugins[name] = {
      fn: fn.bind(this),
      options: {
        enabled: true,
        ...options
      }
    }

    return this
  }

  /**
   * Set log handler.
   *
   * @param {Function} handlerFn Handler function.
   *
   * @returns {Logger} `this`
   */
  setHandler (handlerFn) {
    this._logHandler = handlerFn

    return this
  }

  /**
   * Bind levels.
   */
  _bindLevels () {
    for (const levelName in this._levels) {
      const levelOptions = this._levels[levelName]
      this._bindLevel(levelName, levelOptions)
    }
  }

  /**
   * Bind a level.
   *
   * @param {String} levelName Level name.
   * @param {Object} levelOptions Level options.
   */
  _bindLevel (levelName, levelOptions) {
    this[levelName] = (...args) => this._levelCallback(levelName, levelOptions, args)
  }

  /**
   * Level callback.
   *
   * @param {String} levelName Level name.
   * @param {Object} levelOptions Level options.
   * @param {Array} args Level arguments.
   *
   * @returns {Logger} `this`
   */
  _levelCallback (levelName, levelOptions, args) {
    if (!this._enabled) {
      return
    }

    const msgs = args

    if (this._logHandler !== null) {
      this._logHandler(msgs)
    }

    const { msgs: pMsgs, before, after, styles: pStyles } = this._applyPlugins(levelName, levelOptions, msgs)

    return this._print(levelName, levelOptions, pMsgs, before, after, pStyles)
  }

  /**
   * Bind commands.
   */
  _bindCommands () {
    for (let i = 0, l = this._commands.length; i < l; i++) {
      const command = this._commands[i]

      this[command] = name => console[command](name)
      this[`${command}End`] = name => console[`${command}End`](name)
    }
  }

  /**
   * Apply registered plugins.
   *
   * @param {String} levelName Level name.
   * @param {Object} levelOptions Level options.
   * @param {Array} msgs Messages.
   *
   * @returns {Object} Message, middlewares and styles.
   */
  _applyPlugins (levelName, levelOptions, msgs) {
    let styles = []
    let before = []
    let after = []

    for (const pluginName in this._plugins) {
      const plugin = this._plugins[pluginName]
      const level = { name: levelName, options: levelOptions }

      if (!plugin.options.enabled) {
        continue
      }

      let { msgs: pMsgs, before: pBefore, after: pAfter, styles: pStyles } = plugin.fn(msgs, plugin.options, level)

      if (pMsgs) {
        msgs = pMsgs
      }

      if (pBefore) {
        before = before.concat(`<styles>${pBefore}</styles>`)
      }

      if (pAfter) {
        after = after.concat(pAfter)
      }

      styles = styles.concat(pStyles || {})
    }

    return { msgs, before, after, styles }
  }

  /**
   * Print a message.
   *
   * @param {strin} levelName Level name.
   * @param {Object} levelOptions Level options.
   * @param {Array} msgs Messages.
   * @param {Array} before Before middleware.
   * @param {Array} after After middleware.
   * @param {Array} pluginsStyles Plugins styles.
   *
   * @returns {Logger} `this`
   */
  _print (levelName, levelOptions, msgs, before, after, pluginsStyles) {
    let finalMsgs = []
    let globalStyles = []

    if (levelOptions.styles) {
      // Merge current level and plugins styles
      pluginsStyles = this._mergeStyles(levelOptions.styles, pluginsStyles)
    }

    // Merge plugins styles and concat to global styles
    pluginsStyles = this._parsePluginsStyles(pluginsStyles)
    globalStyles = globalStyles.concat(pluginsStyles)

    // Apply level styles
    if (levelOptions.styles) {
      globalStyles.push(this._parseStyles(levelOptions.styles))
      globalStyles.push('')
    }

    // Before message
    if (before.length) {
      finalMsgs.push(this._parseMsgTags(before).join(' '))
    }

    // Sort messages (string and others types)
    const { stringMsgs, othersMsgs } = this._sortMsgs(msgs)

    if (levelOptions.styles) {
      stringMsgs[0] = `<styles>${stringMsgs[0]}`
      stringMsgs[stringMsgs.length - 1] += '</styles>'
    }

    // Messages
    finalMsgs.push(this._parseMsgTags(stringMsgs).join(' '))

    // After message
    if (after.length) {
      finalMsgs.push(this._parseMsgTags(after).join(' '))
    }

    // Arguments
    const args = [finalMsgs.join(' '), ...globalStyles, ...othersMsgs]

    // Check console
    if (typeof console === 'undefined') {
      return this
    }

    if (typeof this._defaultsLevels[levelName] !== 'undefined') { // Native level
      console[levelName].apply(console, args)
    } else { // Custom level, fallback to console.log()
      console.log.apply(console, args)
    }

    return this
  }

  /**
   * Merge level and plugins styles.
   *
   * @param {Object} levelStyles Level styles.
   * @param {Array} pluginsStyles Plugins styles.
   *
   * @returns {Object} Merged styles.
   */
  _mergeStyles (levelStyles, pluginsStyles) {
    const mergedPluginsStyles = []

    for (let i = 0, l = pluginsStyles.length; i < l; i++) {
      const pluginStyles = pluginsStyles[i]
      mergedPluginsStyles.push({
        ...pluginStyles,
        ...levelStyles
      })
    }

    return mergedPluginsStyles
  }

  /**
   * Parse styles to CSS.
   *
   * @param {Object} styles Styles.
   *
   * @returns {String} Parsed styles.
   */
  _parseStyles (styles) {
    let parsedStyles = ''

    for (let property in styles) {
      const value = styles[property]
      parsedStyles += `${camelToKebab(property)}: ${value};`
    }

    return parsedStyles
  }

  /**
   * Parse plugins styles.
   *
   * @param {Array} pluginsStyles Plugins styles.
   *
   * @returns {Array} Parsed plugins styles.
   */
  _parsePluginsStyles (pluginsStyles) {
    const parsedStyles = []

    for (let i = 0, l = pluginsStyles.length; i < l; i++) {
      const styles = pluginsStyles[i]
      parsedStyles.push(this._parseStyles(styles))
      parsedStyles.push('') // Reset styles
    }

    return parsedStyles
  }

  /**
   * Parse messages tags.
   *
   * @param {Array} msgs Messages.
   *
   * @returns {Array} Parsed messages.
   */
  _parseMsgTags (msgs) {
    for (let i = 0, l = msgs.length; i < l; i++) {
      if (typeof msgs[i] === 'string') {
        msgs[i] = msgs[i].replace(/<(\/)?styles>/gi, '%c')
      }
    }

    return msgs
  }

  /**
   * Sort messages.
   *
   * @param {Array} msgs Messages.
   *
   * @returns {Object} Sorted messages.
   */
  _sortMsgs (msgs) {
    const stringMsgs = []
    const othersMsgs = []

    for (let i = 0, l = msgs.length; i < l; i++) {
      const msg = msgs[i]
      if (typeof msg === 'string') {
        stringMsgs.push(msg)
      } else {
        othersMsgs.push(msg)
      }
    }

    return { stringMsgs, othersMsgs }
  }

  /**
   * Print self error message.
   *
   * @param {String} msg Message.
   */
  _printError (msg) {
    this.reset()
    this.error(msg)
  }
}

export default Logger
