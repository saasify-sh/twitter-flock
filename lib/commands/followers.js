'use strict'

const handleError = require('../handle-error')
const BatchJobFactory = require('../batch-job-factory')
const Workflow = require('../workflow')

const subcommands = ['ids', 'export']
const subcommandsLabel = subcommands.join(', ')

module.exports = (program, context) => {
  program
    .command('followers <subcommand>')
    .description('Perform batch operations on followers')
    .option('-c, --count <int>', 'Limit the max page size', (s) => parseInt(s))
    .option('-l, --limit <int>', 'Limit the max number of users', (s) =>
      parseInt(s)
    )
    .option(
      '-s, --screen-name <string>',
      'Targets a specific twitter user name'
    )
    .option('-u, --user-id <strint>', 'Targets a specific twitter user id')

    .action(async (cmd, opts) => {
      context.requireAuthentication()

      try {
        switch (cmd) {
          case 'ids':
            {
              const job = BatchJobFactory.createBatchJobTwitterGetFollowers({
                params: {
                  maxLimit: opts.limit,
                  count: opts.count,
                  screenName: opts.screenName,
                  userId: opts.userId
                }
              })

              await context.runJob(job)
            }
            break

          case 'export':
            {
              const job = new Workflow(
                {
                  params: {
                    pipeline: [
                      {
                        type: 'twitter:get-followers',
                        label: 'followers',
                        params: {
                          maxLimit: opts.limit,
                          count: opts.count,
                          screenName: opts.screenName,
                          userId: opts.userId
                        }
                      },
                      {
                        type: 'twitter:lookup-users',
                        label: 'users',
                        connect: {
                          userIds: 'followers'
                        },
                        transforms: ['sort-users-by-fuzzy-popularity']
                      }
                    ]
                  }
                },
                context
              )

              await context.runJob(job)
            }
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
