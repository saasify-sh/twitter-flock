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
        const result = await this._run()

        await this._update({
          status: result && result.err ? undefined : 'done',
          ...result
        })
      } catch (err) {
        console.warn('error running job', this.id, err)

        try {
          // update checks `err.code` to see if it's recoverable
          await this._update({
            status: 'error',
            err
          })
        } catch (err) {
          // ignore
        }
      }
    } while (this.status === 'active')

    if (this.status === 'done') {
      await this._transformResults()
    }
  }

  async save() {
    console.log('save', {
      id: this.id,
      type: this.type,
      state: this.state,
      results: this.results.length,
      error: this.error
    })

    if (this._context.db) {
      return this._context.db.put(this.id, this.serialize())
    }
  }

  async _run() {
    throw new Error(`Batch Job "${this.type}" must override "_run()"`)
  }

  async _update(update = {}) {
    const { status, state, error = null, err, results = [] } = update

    const now = utils.getUnixTime()
    this.updatedAt = now

    this.results = this.results.concat(results)
    this.error = error

    if (state) {
      this.state = state
    }

    if (err) {
      this.error = {
        message: err.message,
        code: err.code
      }

      if (err.code) {
        // https://developer.twitter.com/en/docs/basics/response-codes
        switch (err.code) {
          case 88: {
            // rate limit
            this.error.cooldown =
              err.rateLimitReset || now + this._context.cooldown
            this.save()

            const cooldownMs = 1000 * Math.max(1, this.error.cooldown - now)
            const cooldownLabel = ms(cooldownMs, { long: true })

            console.error(err.message)
            await spinner(delay(cooldownMs), `Waiting for ${cooldownLabel}`)
            return
          }
          case 93: // invalid or insufficient oauth credentials
          default:
            this.status = 'error'
        }
      } else {
        this.status = 'error'
      }
    } else if (status) {
      this.status = status
    }

    try {
      await this.save()
    } catch (err) {
      console.error('error saving job', this.id, err)
    }
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
