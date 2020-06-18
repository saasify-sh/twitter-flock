'use strict'

const { format } = require('date-fns')

module.exports = (job) => {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    results: job.results.length,
    error: job.error ? job.error.message : null,
    updatedAt: format(new Date(job.updatedAt * 1000), 'MM/dd/yyyy HH:mm:ss')
  }
}
