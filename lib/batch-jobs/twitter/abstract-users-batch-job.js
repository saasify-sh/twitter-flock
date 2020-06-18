'use strict'

const handlebars = require('handlebars')
const BatchJob = require('../../batch-job')

/**
 * Issue template-based actions in bulk to an array of target users.
 *
 * Uses `handlebars` for templating. Each action is rendered via the given `params.template`
 * handlebars instance with access to the target user's Twitter User object via `user`.
 *
 * Example template: `'Hey @{{user.screen_name}}, check out my latest project https://github.com/saasify-sh/twitter-flock'`.
 *
 * @see https://developer.twitter.com/en/docs/direct-messages/sending-and-receiving/api-reference/new-event
 */
class AbstractUsersBatchJob extends BatchJob {
  constructor(name, data, opts) {
    super(data, opts)
    this.name = name

    // TODO: proper params schema validation
    if (!this.params.users) {
      throw new Error(`${this.name} missing required param "users"`)
    }

    if (!this.params.template) {
      throw new Error(`${this.name} missing required param "template"`)
    }

    if (!this._context.twitterClient) {
      throw new Error('AbstractUsersBatchJob requires a valid twitter client')
    }
  }

  async _runQueryForUser(user, text) {
    throw new Error('Not implemented')
  }

  async _run() {
    const { users, template, ...rest } = this.params

    if (!this._template) {
      this._template = handlebars.compile(template)
    }

    while (this.state.offset < users.length) {
      const user = users[this.state.offset]
      const text = this._template({ ...rest, user })

      this._logger.info(this.id, {
        offset: this.state.offset,
        screenName: user.screen_name,
        text
      })

      await this._runQueryForUser(user, text)

      ++this.state.offset
      await this._update()
    }
  }
}

module.exports = AbstractUsersBatchJob
