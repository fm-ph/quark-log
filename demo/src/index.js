import { Logger, plugins } from 'quark-log'

const logger = new Logger()

logger.plugin('time', plugins.time)
logger.plugin('namespace', plugins.namespace, { name: 'logger', capitalize: true })

logger.log('Test', { test: true }, 10)

logger.log('Test')
logger.info('Test')
logger.warn('Test')
logger.error('Test')

logger.off()
logger.log('This test will not be logged')
logger.on()

logger.group('Group')
logger.log('Test in a group')
logger.groupEnd()

logger.time('timer')
logger.log('Timer')
logger.timeEnd('timer')

logger.level('log', {
  styles: {
    color: 'red'
  }
})
logger.log('Test in red', { test: true })

logger.level('bold', {
  styles: {
    fontWeight: 'bold'
  }
})

logger.bold('Test')

logger.reset()

logger.br()

logger.plugin('namespace', plugins.namespace, { name: 'test', capitalize: false })
logger.log('New namespace')

logger.plugin('namespace', { enabled: false })
logger.log('New namespace')
