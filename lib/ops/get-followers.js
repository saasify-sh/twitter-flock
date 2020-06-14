'use strict'

const BatchJob = require('../batch-job')

class BatchJobGetFollowers extends BatchJob {
  async _run() {
    return this.twitterClient.resolvePagedQuery('followers/ids', {
      resultsKey: 'ids',
      maxLimit: 10,
      twitterOptions: {
        stringify_ids: true,
        count: 2
      }
    })
  }
}

module.exports = BatchJobGetFollowers
