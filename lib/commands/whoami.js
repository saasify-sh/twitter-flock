'use strict'

const handleError = require('../handle-error')

module.exports = (program, context) => {
  program
    .command('whoami')
    .description('Prints information about the current user')
    .action(async (arg, opts) => {
      context.requireAuthentication()

      try {
        await context.writeOutput(context.auth.get())
      } catch (err) {
        handleError(program, err)
      }
    })
}
