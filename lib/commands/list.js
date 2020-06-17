'use strict'

const handleError = require('../handle-error')
const pruneJob = require('../prune-job')

module.exports = (program, context) => {
  program
    .command('list')
    .alias('ls')
    .description('Lists your local batch jobs')
    .option('-v, --verbose', 'Display full deployments', false)
    .option('-t, --type <string>', 'Filter by job type')
    .option('-s, --status <string>', 'Filter by job status')
    .option('-l, --limit <int>', 'Limit the number of results', (s) =>
      parseInt(s)
    )
    .action(async (opts) => {
      try {
        let jobs = await new Promise((resolve, reject) => {
          const records = []
          let active = true

          context.db
            .createValueStream()
            .on('data', (record) => {
              if (!active) {
                return
              }

              if (opts.type && record.type !== opts.type) {
                return
              }

              if (opts.status && record.status !== opts.status) {
                return
              }

              if (opts.limit >= 0 && records.length >= opts.limit) {
                active = false
                resolve(records)
                return
              }

              records.push(record)
            })
            .on('error', reject)
            .on('close', () => resolve(records))
            .on('end', () => resolve(records))
        })

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
