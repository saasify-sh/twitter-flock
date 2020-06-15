'use strict'

const BatchJob = require('../../batch-job')
const twitter = require('../../twitter')

/**
 * Fetches the Twitter user IDs for all users following a given user
 * (defaults to the authenticated user) via batched calls to`followers/ids`.
 *
 * @see https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-followers-ids
 */
class BatchJobTwitterGetFollowers extends BatchJob {
  static type = 'twitter:get-followers'

  constructor(data) {
    super({
      ...data,
      type: BatchJobTwitterGetFollowers.type,
      cooldown: 15 * 60
    })
  }

  async _run() {
    const {
      accessToken,
      accessTokenSecret,
      maxLimit,
      userId,
      screenName,
      ...rest
    } = this.params

    if (!this._twitterClient) {
      this._twitterClient = await twitter.getClient({
        accessToken,
        accessTokenSecret
      })
    }

    const {
      results,
      err,
      ...state
    } = await this._twitterClient.resolvePagedQuery('followers/ids', {
      resultsKey: 'ids',
      maxLimit,
      twitterOptions: {
        stringify_ids: true,
        count: 5000,
        user_id: userId,
        screen_name: screenName,
        ...rest,
        ...this.state
      }
    })

    return {
      results,
      err,
      state
    }
  }
}

module.exports = BatchJobTwitterGetFollowers
