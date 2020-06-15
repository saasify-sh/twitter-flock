'use strict'

const pick = require('lodash.pick')
const shortid = require('shortid')

const utils = require('./utils')

/**
 * Abstract base class for robustly running batch jobs that are serializable and
 * resumable in order to be reliable against rate limits.
 *
 * TODO: beyond MVP this should be replaced by a more robust solution like
 * Apache Kafka.
 */
class BatchJob {
  // status = 'active' | 'done' | 'error'

  constructor(data) {
    this.id = data.id || shortid.generate()
    this.status = data.status || 'active'
    this.error = data.error
    this.state = data.state || {}
    this.params = data.params || {}
    this.results = data.results || []
    this.createdAt = data.createdAt || utils.getUnixTime()
    this.updatedAt = data.updatedAt || this.createdAt

    this.type = data.type
    this._cooldown = data.cooldown || 15 * 60

    if (!this.type) {
      throw new Error('Invalid BatchJob')
    }
  }

  async run() {
    try {
      const { results, err, ...state } = await this._run()
      const now = utils.getUnixTime()

      this.results = this.results.concat(results)
      this.state = state
      this.updatedAt = now

      if (!err) {
        this.status = 'done'
        this.error = null
      } else {
        this.error = {
          message: err.message,
          code: err.code
        }

        if (err.code) {
          // https://developer.twitter.com/en/docs/basics/response-codes
          // code 88 = rate limit
          if (err.code === 88) {
            this.error.cooldown = now + this._cooldown
          }
        } else {
          this.status = 'error'
        }
      }
    } catch (err) {
      console.error(err)

      const now = utils.getUnixTime()
      this.status = 'error'
      this.error = {
        message: err.message
      }
      this.updatedAt = now
    }
  }

  async _run() {
    throw new Error(`Batch Job "${this.type}" is supposed to override "_run()"`)
  }

  seralize() {
    return JSON.stringify(
      pick(this, [
        'id',
        'type',
        'status',
        'state',
        'params',
        'createdAt',
        'updatedAt',
        'error',
        'results'
      ])
    )
  }
}

module.exports = BatchJob
