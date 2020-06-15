'use strict'

const BatchJobTwitterGetFollowers = require('./batch-jobs/twitter/get-followers')
const BatchJobTwitterLookupUsers = require('./batch-jobs/twitter/lookup-users')
const BatchJobTwitterSendDirectMessages = require('./batch-jobs/twitter/send-direct-messages')
const Workflow = require('./workflow')

class BatchJobFactory {
  static deseralize(str) {
    const data = JSON.parse(str)

    switch (data.type) {
      case BatchJobTwitterGetFollowers.type:
        return new BatchJobTwitterGetFollowers(data)
      case BatchJobTwitterLookupUsers.type:
        return new BatchJobTwitterLookupUsers(data)
      case BatchJobTwitterSendDirectMessages.type:
        return new BatchJobTwitterSendDirectMessages(data)
      case Workflow.type:
        return new Workflow(data)
      default:
        throw new Error(
          `Error deserializing unrecognized job "${data.id}" of type "${data.type}"`
        )
    }
  }

  static createWorkflow(data) {
    return new Workflow(data)
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
