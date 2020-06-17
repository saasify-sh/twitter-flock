'use strict'

module.exports = async function getJobsQuery(opts, context) {
  return new Promise((resolve, reject) => {
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
}
