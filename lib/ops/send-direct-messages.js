'use strict'

const BatchJob = require('../batch-job')
const twitter = require('../twitter')
const handlebars = require('handlebars')

/**
 * Sends template-based DMs in bulk to an array of target user IDs.
 *
 * @see https://developer.twitter.com/en/docs/direct-messages/sending-and-receiving/api-reference/new-event
 */
class BatchJobTwitterSendDirectMessages extends BatchJob {
  constructor(data) {
    super({
      ...data,
      type: 'twitter:send-direct-messages',
      cooldown: 24 * 60 * 60
    })

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

    let { offset = 0 } = this.state
    let index = 0

    if (!this._twitterClient) {
      this._twitterClient = await twitter.getClient({
        accessToken,
        accessTokenSecret
      })
    }

    if (!this._template) {
      this._template = handlebars.compile(template)
    }

    while (offset < users.length) {
      const user = users[offset]
      const text = this._template({ ...rest, user })

      console.log(this.type, {
        offset,
        screenName: user.screen_name,
        text
      })

      try {
        const res = await this._twitterClient.resolveTwitterQuery({
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

        delete res._headers
        console.log('DM', res)
      } catch (err) {
        if (err.code || index > 0) {
          return {
            offset,
            err
          }
        }

        throw err
      }

      ++index
      ++offset
    }
  }
}

module.exports = BatchJobTwitterSendDirectMessages
