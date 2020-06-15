'use strict'

const BatchJobGetFollowers = require('./ops/get-followers')
const BatchJobLookupUsers = require('./ops/lookup-users')

class BatchJobFactory {
  static deseralize(str) {
    const data = JSON.parse(str)

    switch (data.type) {
      case 'get-followers':
        return new BatchJobGetFollowers(data)
      case 'lookup-users':
        return new BatchJobLookupUsers(data)
      default:
        throw new Error(
          `Error deserializing unrecognized job "${data.id}" of type "${data.type}"`
        )
    }
  }

  static createBatchJobGetFollowers(data) {
    return new BatchJobGetFollowers(data)
  }

  static createBatchJobLookupUsers(data) {
    return new BatchJobLookupUsers(data)
  }
}

module.exports = BatchJobFactory
