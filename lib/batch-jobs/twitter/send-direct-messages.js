'use strict'

const handlebars = require('handlebars')
const BatchJob = require('../../batch-job')
const twitter = require('../../twitter')

/**
 * Sends template-based DMs in bulk to an array of target users.
 *
 * Uses `handlebars` for templating. Each DM is rendered via the given `params.template`
 * handlebars instance with access to the target user's Twitter User object via `user`.
 *
 * Example template: `'Hey @{{user.screen_name}}, check out my latest project https://github.com/saasify-sh/twitter-flock'`.
 *
 * @see https://developer.twitter.com/en/docs/direct-messages/sending-and-receiving/api-reference/new-event
 */
class BatchJobTwitterSendDirectMessages extends BatchJob {
  static type = 'twitter:send-direct-messages'

  constructor(data, opts) {
    super(
      {
        state: {
          offset: 0
        },
        ...data,
        type: BatchJobTwitterSendDirectMessages.type
      },
      {
        cooldown: 24 * 60 * 60,
        ...opts
      }
    )

    // TODO: proper params schema validation
    if (!this.params.users) {
      throw new Error(
        'BatchJobTwitterSendDirectMessages missing required param "users"'
      )
    }

    if (!this.params.template) {
      throw new Error(
        'BatchJobTwitterSendDirectMessages missing required param "template"'
      )
    }
  }

  async _run() {
    const {
      accessToken,
      accessTokenSecret,
      users,
      template,
      ...rest
    } = this.params

    if (!this._twitterClient) {
      this._twitterClient = await twitter.getClient({
        logger: this._logger,
        accessToken,
        accessTokenSecret
      })
    }

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

      await this._twitterClient.resolveTwitterQuery({
        logger: this._logger,
        endpoint: 'direct_messages/events/new',
        method: 'post',
        params: {
          event: {
            type: 'message_create',
            message_create: {
              target: {
                recipient_id: user.id_str
              },
              message_data: {
                text
              }
            }
          }
        }
      })

      ++this.state.offset
      await this._update()
    }
  }
}

module.exports = BatchJobTwitterSendDirectMessages
