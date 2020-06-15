'use strict'

const BatchJobTwitterGetFollowers = require('./batch-jobs/twitter/get-followers')
const BatchJobTwitterLookupUsers = require('./batch-jobs/twitter/lookup-users')
const BatchJobTwitterSendDirectMessages = require('./batch-jobs/twitter/send-direct-messages')

class BatchJobFactory {
  static deserialize(str) {
    const data = JSON.parse(str)

    switch (data.type) {
      case BatchJobTwitterGetFollowers.type:
        return new BatchJobTwitterGetFollowers(data)
      case BatchJobTwitterLookupUsers.type:
        return new BatchJobTwitterLookupUsers(data)
      case BatchJobTwitterSendDirectMessages.type:
        return new BatchJobTwitterSendDirectMessages(data)
      default:
        throw new Error(
          `Error deserializing unrecognized job "${data.id}" of type "${data.type}"`
        )
    }
  }

  static createBatchJobTwitterGetFollowers(data) {
    return new BatchJobTwitterGetFollowers(data)
  }

  static createBatchJobTwitterLookupUsers(data) {
    return new BatchJobTwitterLookupUsers(data)
  }

  static createBatchJobTwitterSendDirectMessages(data) {
    return new BatchJobTwitterSendDirectMessages(data)
  }
}

module.exports = BatchJobFactory
