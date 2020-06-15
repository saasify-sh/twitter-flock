'use strict'

const BatchJob = require('../batch-job')
const twitter = require('../twitter')

/**
 * Converts an array of Twitter user IDs or screen names into full Twitter User
 * objects via batched calls to `users/lookup`.
 *
 * @see https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-users-lookup
 */
class BatchJobLookupUsers extends BatchJob {
  constructor(data) {
    super({
      ...data,
      type: 'lookup-users',
      cooldown: 15 * 60
    })
  }

  async _run() {
    const {
      accessToken,
      accessTokenSecret,
      userIds,
      screenNames,
      batchSize = 100,
      ...rest
    } = this.params

    let { offset = 0 } = this.state
    let results = []

    const inputs = userIds || screenNames || []
    const inputKey = userIds ? 'user_id' : 'screen_name'

    if (!this.twitterClient) {
      this.twitterClient = await twitter.getClient({
        accessToken,
        accessTokenSecret
      })
    }

    while (offset < inputs.length) {
      const inputBatch = inputs.slice(offset, offset + batchSize)

      if (!inputBatch.length) {
        break
      }

      let batchRes

      try {
        batchRes = await this.twitterClient.resolveTwitterQuery({
          endpoint: 'users/lookup',
          params: {
            ...rest,
            [inputKey]: inputBatch.join(',')
          }
        })
      } catch (err) {
        if (err.code || results.length > 0) {
          return {
            offset,
            err,
            results
          }
        }

        throw err
      }

      if (!batchRes.length) {
        break
      }

      results = results.concat(batchRes)
      offset += batchRes.length

      console.log(
        'twitter',
        this.type,
        `offset=${offset} size=${batchRes.length} total=${results.length}`
      )
    }

    return {
      results
    }
  }
}

module.exports = BatchJobLookupUsers
