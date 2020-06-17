'use strict'

const getJobsQuery = require('../get-jobs-query')
const handleError = require('../handle-error')
const pruneJob = require('../prune-job')

module.exports = (program, context) => {
  program
    .command('list')
    .alias('ls')
    .description('Lists your existing batch jobs')
    .option('-v, --verbose', 'Display full deployments', false)
    .option('-t, --type <string>', 'Filter by job type')
    .option('-s, --status <string>', 'Filter by job status')
    .option('-l, --limit <int>', 'Limit the number of results', (s) =>
      parseInt(s)
    )
    .action(async (opts) => {
      try {
        let jobs = await getJobsQuery(opts, context)

        // sort records with most recent first
        jobs.sort((a, b) => b.updatedAt - a.updatedAt)

        if (!opts.verbose) {
          jobs = jobs.map((job) => pruneJob(job))
        }

        program.writeOutput(JSON.stringify(jobs, null, 2))
      } catch (err) {
        handleError(program, err)
      }
    })
}
