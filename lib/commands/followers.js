'use strict'

const handleError = require('../handle-error')

const subcommands = ['ids', 'export']
const subcommandsLabel = subcommands.join(', ')

module.exports = (program, context) => {
  program
    .command('followers <subcommand>')
    .description('Perform batch operations on your followers')
    .action(async (cmd, opts) => {
      program.requireAuthentication()

      try {
        switch (cmd) {
          case 'ids':
            context.logger.error('TODO: followers export')
            break

          case 'export':
            context.logger.error('TODO: followers export')
            break

          default: {
            if (!cmd) {
              context.logger.error(
                `Error: missing subcommand (${subcommandsLabel})`
              )
            } else {
              context.logger.error(
                `Error: invalid subcommand "${cmd}" (${subcommandsLabel})`
              )
            }

            process.exit(1)
          }
        }
      } catch (err) {
        handleError(program, err)
      }
    })
}
