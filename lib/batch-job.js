'use strict'

const pick = require('lodash.pick')
const shortid = require('shortid')
const delay = require('delay')
const ms = require('ms')

const spinner = require('./spinner')
const transforms = require('./transforms')
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

  constructor(data, opts = {}) {
    this.type = data.type
    if (!this.type) {
      throw new Error(
        `Error initializing BatchJob${
          data.id ? ' ' + data.id : ''
        } missing required "type"`
      )
    }

    this.id = data.id || `${data.type}:${shortid.generate()}`
    this.status = data.status || 'active'
    this.error = data.error
    this.state = data.state || {}
    // TODO: basic proper params schema validation
    this.params = data.params || {}
    this.results = data.results || []
    this.createdAt = data.createdAt || utils.getUnixTime()
    this.updatedAt = data.updatedAt || this.createdAt
    this.label = data.label || this.id

    this._context = {
      cooldown: 15 * 60,
      transforms: [],
      ...opts
    }

    // TODO: transforms should probably just be another batchjob in a workflow
    for (const transform of this._context.transforms) {
      if (!transforms.getTransform(transform)) {
        throw new Error(
          `Error initializing BatchJob "${this.id}" encountered unregistered transform "${transform}"`
        )
      }
    }

    if (!this._context.db) {
      console.warn(`Warning: no storage provided for BatchJob "${this.id}")`)
    }
  }

  async run() {
    if (this.status !== 'active') {
      return
    }

    do {
      try {
        const res = await this._run()
        const { results = [], err, error, status, state = {} } = res || {}

        // TODO: this logic needs a refactor cleanup
        // TODO: make it so this gets called repeatedly for snapshotting purposes
        // TODO: gracefully handle process exit

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
              case 88: {
                // rate limit
                this.error.cooldown = now + this._context.cooldown
                this.save()

                const cooldownMs = this._context.cooldown * 1000
                const cooldownLabel = ms(cooldownMs, { long: true })
                console.error(err.message)
                await spinner(delay(cooldownMs), `Waiting for ${cooldownLabel}`)

                break
              }
              case 93: // invalid or insufficient oauth credentials
              default:
                this.status = 'error'
            }
          } else {
            this.status = 'error'
          }
        }
      } catch (err) {
        console.error('error running job', this.id, err)

        const now = utils.getUnixTime()
        this.updatedAt = now

        this.status = 'error'
        this.error = {
          message: err.message
        }
      }

      try {
        await this.save()
      } catch (err) {
        console.error('error saving job', this.id, err)
      }
    } while (this.status === 'active')

    if (this.status === 'done') {
      await this._transformResults()
    }

    await this.save()
  }

  async save() {
    if (this._context.db) {
      return this._context.db.put(this.id, this.serialize())
    }
  }

  async _run() {
    throw new Error(`Batch Job "${this.id}" is supposed to override "_run()"`)
  }

  async _transformResults() {
    let results = this.results

    for (const transform of this._context.transforms) {
      const transformFunc = transforms.getTransform(transform)
      results = await Promise.resolve(transformFunc(results))
    }

    this.results = results
  }

  serialize() {
    return pick(this, [
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
  }
}

module.exports = BatchJob
