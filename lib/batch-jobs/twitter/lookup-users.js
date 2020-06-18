'use strict'

const BatchJob = require('../../batch-job')

/**
 * Converts an array of Twitter user IDs or screen names into full Twitter User
 * objects via batched calls to `users/lookup`.
 *
 * @see https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-users-lookup
 */
class BatchJobTwitterLookupUsers extends BatchJob {
  static type = 'twitter:lookup-users'

  constructor(data, opts) {
    super(
      {
        state: {
          offset: 0
        },
        ...data,
        type: BatchJobTwitterLookupUsers.type
      },
      opts
    )

    if (!this._context.twitterClient) {
      throw new Error(
        'BatchJobTwitterLookupUsers requires a valid twitter client'
      )
    }
  }

  async _run() {
    const { userIds, screenNames, batchSize = 100, ...rest } = this.params

    const inputs = userIds || screenNames || []
    const inputKey = userIds ? 'user_id' : 'screen_name'

    while (this.state.offset < inputs.length) {
      const inputBatch = inputs.slice(
        this.state.offset,
        this.state.offset + batchSize
      )

      if (!inputBatch.length) {
        break
      }

      const batchResults = await this._context.twitterClient.resolveTwitterQuery(
        {
          logger: this._logger,
          endpoint: 'users/lookup',
          params: {
            ...rest,
            [inputKey]: inputBatch.join(',')
          }
        }
      )

      if (!batchResults.length) {
        break
      }

      this.state.offset += batchResults.length
      await this._update({
        results: batchResults
      })
    }
  }
}

module.exports = BatchJobTwitterLookupUsers
