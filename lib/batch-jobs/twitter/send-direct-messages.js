'use strict'

const AbstractUsersBatchJob = require('./users-batchjob-base')

/**
 * Sends template-based DMs in bulk to an array of target users.
 *
 * Example template: `'Hey @{{user.screen_name}}, check out my latest project https://github.com/saasify-sh/twitter-flock'`.
 *
 * @see https://developer.twitter.com/en/docs/direct-messages/sending-and-receiving/api-reference/new-event
 */
class BatchJobTwitterSendDirectMessages extends AbstractUsersBatchJob {
  static type = 'twitter:send-direct-messages'

  constructor(data, opts) {
    super(
      'BatchJobTwitterSendDirectMessages',
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
  }

  async _runQueryForUser(user, text) {
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
  }
}

module.exports = BatchJobTwitterSendDirectMessages
