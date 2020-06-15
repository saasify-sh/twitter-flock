'use strict'

const BatchJobTwitterGetFollowers = require('./ops/get-followers')
const BatchJobTwitterLookupUsers = require('./ops/lookup-users')
const BatchJobTwitterSendDirectMessages = require('./ops/send-direct-messages')

class BatchJobFactory {
  static deseralize(str) {
    const data = JSON.parse(str)

    switch (data.type) {
      case 'twitter:get-followers':
        return new BatchJobTwitterGetFollowers(data)
      case 'twitter:lookup-users':
        return new BatchJobTwitterLookupUsers(data)
      case 'twitter:send-direct-messages':
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
