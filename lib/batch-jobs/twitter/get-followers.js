'use strict'

const BatchJob = require('../../batch-job')

/**
 * Fetches the Twitter user IDs for all followers for a given user
 * (defaults to the authenticated user) via batched calls to `followers/ids`.
 *
 * @see https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-followers-ids
 */
class BatchJobTwitterGetFollowers extends BatchJob {
  static type = 'twitter:get-followers'

  constructor(data, opts) {
    super(
      {
        ...data,
        type: BatchJobTwitterGetFollowers.type
      },
      opts
    )

    if (!this._context.twitterClient) {
      throw new Error(
        'BatchJobTwitterGetFollowers requires a valid twitter client'
      )
    }
  }

  async _run() {
    const { maxLimit, userId, screenName, ...rest } = this.params

    const {
      results,
      err,
      ...state
    } = await this._context.twitterClient.resolvePagedQuery('followers/ids', {
      resultsKey: 'ids',
      maxLimit,
      twitterOptions: {
        stringify_ids: true,
        count: 5000,
        user_id: userId,
        screen_name: screenName,
        ...rest,
        ...this.state
      },
      onPage: async ({ results, ...state }) => {
        return this._update({ results, state })
      }
    })

    return {
      err,
      state
    }
  }
}

module.exports = BatchJobTwitterGetFollowers
