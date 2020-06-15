'use strict'

const pick = require('lodash.pick')
const shortid = require('shortid')

const utils = require('./utils')

/**
 * Abstract base class for running robust batch jobs that are serializable and
 * resumable.
 *
 * These features allow us to run potentially large batch jobs that are capable
 * of recovering from errors and dealing wth rate limits.
 *
 * TODO: this should eventually be replaced by a more robust solution like
 * Apache Kafka.
 */
class BatchJob {
  // status = 'active' | 'done' | 'error'

  constructor(data) {
    this.id = data.id || shortid.generate()
    this.status = data.status || 'active'
    this.error = data.error
    this.state = data.state || {}
    // TODO: basic proper params schema validation
    this.params = data.params || {}
    this.results = data.results || []
    this.createdAt = data.createdAt || utils.getUnixTime()
    this.updatedAt = data.updatedAt || this.createdAt
    this.label = data.label || this.id

    this.type = data.type
    this._cooldown = data.cooldown || 15 * 60

    if (!this.type) {
      throw new Error('Invalid BatchJob')
    }
  }

  async run() {
    try {
      const res = await this._run()
      const { results = [], err, error, status, state = {} } = res || {}
      const now = utils.getUnixTime()

      this.results = this.results.concat(results)
      this.state = state
      this.error = error
      this.updatedAt = now

      if (status) {
        this.status = status
      } else if (!err) {
        this.status = 'done'
        this.error = null
      } else {
        this.error = {
          message: err.message,
          code: err.code
        }

        if (err.code) {
          // https://developer.twitter.com/en/docs/basics/response-codes
          switch (err.code) {
            case 88: // rate limit
              this.error.cooldown = now + this._cooldown
              break
            case 93: // insufficient oauth credentials
            default:
              this.status = 'error'
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

  serialize() {
    return JSON.stringify(
      pick(this, [
        'id',
        'label',
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