'use strict'

const pick = require('lodash.pick')
const shortid = require('shortid')
const twitter = require('./twitter')

class BatchJob {
  constructor(data) {
    this.id = data.id || shortid.generate()
    this.status = data.status || 'init'
    this.state = data.state || {}
    this.params = data.params || {}
    this.type = data.type

    if (!this.type) {
      throw new Error('Invalid BatchJob')
    }

    this.twitterClient = twitter.getClient(this.state)
  }

  async run() {
    try {
      const res = await this._run()

      // TODO: update state accordingly
    } catch (err) {
      console.error(err)
    }
  }

  async _run() {
    throw new Error(`Batch Job "${this.type}" is supposed to override "_run()"`)
  }

  seralize() {
    return JSON.stringify(
      pick(this, ['id', 'type', 'status', 'state', 'params'])
    )
  }

  static createGetFollowersBatchJob(data) {
    return new BatchJob({
      ...data,
      type: 'get-followers'
    })
  }

  static deseralize(str) {
    return new BatchJob(JSON.parse(str))
  }
}

module.exports = BatchJob
