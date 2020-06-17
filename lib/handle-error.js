'use strict'

const PrettyError = require('pretty-error')
const logger = require('./logger')

const prettyError = new PrettyError()

module.exports = (program, err) => {
  const detail = err.response
    ? (err.response.data && err.response.data.error) || err.response.statusText
    : undefined

  logger.error(err.message)
  if (detail) {
    logger.error(detail)
  }

  if (program.debug) {
    logger.error(prettyError.render(err))
  }

  process.exit(1)
}
