'use strict'

const BatchJob = require('../batch-job')
const twitter = require('../twitter')

/**
 * Fetches the Twitter user IDs for all users following a given user
 * (defaults to the authenticated user) via batched calls to`followers/ids`.
 *
 * @see https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-followers-ids
 */
class BatchJobGetFollowers extends BatchJob {
  constructor(data) {
    super({
      ...data,
      type: 'get-followers',
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

    if (!this.twitterClient) {
      this.twitterClient = await twitter.getClient({
        accessToken,
        accessTokenSecret
      })
    }

    return this.twitterClient.resolvePagedQuery('followers/ids', {
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
  }
}

module.exports = BatchJobGetFollowers
