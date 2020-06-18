'use strict'

const { Confirm } = require('enquirer')
const pluralize = require('pluralize')

const getJobsQuery = require('../get-jobs-query')
const handleError = require('../handle-error')
const spinner = require('../spinner')

module.exports = (program, context) => {
  program
    .command('remove [jobId...]')
    .alias('rm')
    .description('Removes batch jobs')
    .option('-y, --yes', 'Skip confirmation')
    .option('-a, --all', 'Removes all batch jobs')
    .option('-t, --type <string>', 'Filter by job type (when using --all)')
    .option('-s, --status <string>', 'Filter by job status (when using --all)')
    .action(async (jobIds, opts) => {
      try {
        if (opts.all) {
          jobIds = (await getJobsQuery(opts, context)).map((job) => job.id)
        }

        const jobsLabel = pluralize('job', jobIds.length)

        if (!opts.yes) {
          console.error(`${jobsLabel}:`, jobIds.join(', '))

          const prompt = new Confirm({
            message: `Are you sure you want to delete these ${jobIds.length} ${jobsLabel}?`,
            initial: true
          })

          const answer = await prompt.run()
          if (!answer) {
            process.exit(1)
          }
        }

        const ops = jobIds.map((jobId) => ({
          type: 'del',
          key: jobId
        }))

        await spinner(
          context.db.batch(ops),
          `Removing ${jobIds.length} ${jobsLabel}`
        )

        context.logger.info(`Removed ${jobIds.length} ${jobsLabel}`)
      } catch (err) {
        handleError(program, err)
      }
    })
}
