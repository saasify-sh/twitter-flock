'use strict'

const Twitter = require('twitter-lite')
const pRetry = require('p-retry')

const saasifyClientId = process.env.PROVIDER_TWITTER_CLIENT_ID
const saasifyClientSecret = process.env.PROVIDER_TWITTER_CLIENT_SECRET

const MAX_TWEETS_PAGE_SIZE = 200

exports.getClient = async ({
  clientId = saasifyClientId,
  clientSecret = saasifyClientSecret,
  accessToken,
  accessTokenSecret
}) => {
  const twitterClient = new Twitter({
    consumer_key: clientId,
    consumer_secret: clientSecret,
    access_token_key: accessToken,
    access_token_secret: accessTokenSecret
  })

  async function resolvePagedQuery(endpoint, opts) {
    const {
      log = console.error.bind(console),
      maxLimit,
      onPage,
      resultsKey,
      twitterOptions = {
        count: MAX_TWEETS_PAGE_SIZE
      }
    } = opts

    let results = []
    let page = 0
    let cursor = twitterOptions.cursor
    let maxId = twitterOptions.maxId

    do {
      const params = { ...twitterOptions }
      if (cursor) {
        params.cursor = cursor
      } else if (maxId) {
        params.max_id = maxId
      }

      let pageRes

      try {
        pageRes = await resolveTwitterQuery({
          endpoint,
          params,
          log
        })
      } catch (err) {
        log(
          'twitter error',
          { endpoint, page, numResults: results.length },
          err
        )

        if (err.code || results.length > 0) {
          return {
            cursor,
            maxId,
            err,
            results
          }
        }

        throw err
      }

      let pageResults = resultsKey ? pageRes[resultsKey] : pageRes

      if (!pageResults || !Array.isArray(pageResults)) {
        throw new Error(
          `twitter logic error; invalid resultsKey "${resultsKey}"`
        )
      }

      if (maxId) {
        pageResults = pageResults.slice(1)
      }

      if (!pageResults.length) {
        break
      }

      if (!resultsKey) {
        maxId = pageResults[pageResults.length - 1].id_str
      }

      cursor = pageRes.next_cursor_str
      results = results.concat(pageResults)

      log(
        'twitter',
        endpoint,
        `page=${page} size=${pageResults.length} total=${results.length}`
      )

      if (resultsKey && (!cursor || cursor === '0')) {
        break
      }

      if (onPage) {
        await onPage(pageResults)
      }

      if (maxLimit && results.length >= maxLimit) {
        break
      }

      ++page
    } while (true)

    return {
      results
    }
  }

  async function resolveTwitterQuery(opts) {
    const { endpoint, params, log = console.error.bind(console) } = opts
    log('twitter', endpoint, params)
    let code

    try {
      return await pRetry(
        async () => {
          try {
            const res = await twitterClient.get(endpoint, params)
            return res
          } catch (err) {
            const error = err.errors && err.errors[0]

            if (error) {
              code = error.code
              throw new pRetry.AbortError(error.message)
            } else {
              throw err
            }
          }
        },
        {
          retries: 3,
          maxTimeout: 10000
        }
      )
    } catch (err) {
      if (code) {
        err.code = code
      }

      throw err
    }
  }

  twitterClient.resolvePagedQuery = resolvePagedQuery
  twitterClient.resolveTwitterQuery = resolveTwitterQuery

  return twitterClient
}
