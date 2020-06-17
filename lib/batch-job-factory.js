'use strict'

const BatchJobTwitterGetFollowers = require('./batch-jobs/twitter/get-followers')
const BatchJobTwitterLookupUsers = require('./batch-jobs/twitter/lookup-users')
const BatchJobTwitterSendDirectMessages = require('./batch-jobs/twitter/send-direct-messages')
const BatchJobTwitterSendTweets = require('./batch-jobs/twitter/send-tweets')

/**
 * Convenience factory for deserializing saved batch jobs and for initializing
 * new instances of built-in batch jobs.
 */
class BatchJobFactory {
  static deserialize(data, opts) {
    if (typeof data !== 'object') {
      throw new Error(`Error BatchJobFactory.deserialize passed invalid data`)
    }

    switch (data.type) {
      case BatchJobTwitterGetFollowers.type:
        return BatchJobFactory.createBatchJobTwitterGetFollowers(data, opts)
      case BatchJobTwitterLookupUsers.type:
        return BatchJobFactory.createBatchJobTwitterLookupUsers(data, opts)
      case BatchJobTwitterSendDirectMessages.type:
        return BatchJobFactory.createBatchJobTwitterSendDirectMessages(
          data,
          opts
        )
      case BatchJobTwitterSendTweets.type:
        return BatchJobFactory.createBatchJobTwitterSendTweets(data, opts)
      default:
        throw new Error(
          `Error BatchJobFactory.deserialize unrecognized job "${data.id}" of type "${data.type}"`
        )
    }
  }

  static createBatchJobTwitterGetFollowers(data, opts) {
    return new BatchJobTwitterGetFollowers(data, opts)
  }

  static createBatchJobTwitterLookupUsers(data, opts) {
    return new BatchJobTwitterLookupUsers(data, opts)
  }

  static createBatchJobTwitterSendDirectMessages(data, opts) {
    return new BatchJobTwitterSendDirectMessages(data, opts)
  }

  static createBatchJobTwitterSendTweets(data, opts) {
    return new BatchJobTwitterSendTweets(data, opts)
  }
}

module.exports = BatchJobFactory
