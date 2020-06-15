'use strict'

const pick = require('lodash.pick')
const shortid = require('shortid')

const utils = require('./utils')
const transforms = require('./transforms')

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
    this._transforms = data.transforms || []

    if (!this.type) {
      throw new Error(
        `Error initializing BatchJob${
          data.id ? ' ' + data.id : ''
        } missing required "type"`
      )
    }

    for (const transform of this._transforms) {
      if (!transforms.getTransform(transform)) {
        throw new Error(
          `Error initializing BatchJob "${this.type}" "${this.id}" encountered unregistered transform "${transform}"`
        )
      }
    }
  }

  async run() {
    if (this.status !== 'active') {
      return
    }

    try {
      const res = await this._run()
      const { results = [], err, error, status, state = {} } = res || {}

      // TODO: this logic needs a refactor cleanup

      this.results = this.results.concat(results)
      this.state = state
      this.error = error

      const now = utils.getUnixTime()
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
      this.updatedAt = now

      this.status = 'error'
      this.error = {
        message: err.message
      }
    }

    if (this.status === 'done') {
      await this._transformResults()
    }
  }

  async _run() {
    throw new Error(`Batch Job "${this.type}" is supposed to override "_run()"`)
  }

  async _transformResults() {
    for (const transform of this._transforms) {
      const transformFunc = transforms.getTransform(transform)
      this.results = await Promise.resolve(transformFunc(this.results))
    }
  }

  serialize() {
    return JSON.stringify(
      pick(this, [
        'id',
        'type',
        'label',
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
