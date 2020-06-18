'use strict'

const clipboard = require('clipboardy')

const handleError = require('../handle-error')
const BatchJobFactory = require('../batch-job-factory')

const subcommands = ['ids', 'export']
const subcommandsLabel = subcommands.join(', ')

module.exports = (program, context) => {
  program
    .command('followers <subcommand>')
    .description('Perform batch operations on your followers')
    .action(async (cmd, opts) => {
      context.requireAuthentication()

      try {
        switch (cmd) {
          case 'ids':
            {
              const job = BatchJobFactory.createBatchJobTwitterGetFollowers({
                params: {
                  maxLimit: 10,
                  count: 10
                }
              })

              if (program.clipboard) {
                clipboard.writeSync(job.id)
                context.logger.info(`Copied job "${job.id}" to clipboard`)
              }

              await job.run()
            }
            break

          case 'export':
            context.logger.error('TODO: followers export')
            break

          default: {
            if (!cmd) {
              context.logger.error(
                `Error: missing subcommand. Supported subcommands: ${subcommandsLabel}`
              )
            } else {
              context.logger.error(
                `Error: invalid subcommand "${cmd}". Supported subcommands: ${subcommandsLabel}`
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
