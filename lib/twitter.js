'use strict'

const Twitter = require('twitter-lite')
const pRetry = require('p-retry')
const defaultLogger = require('./logger')

const defaultClientId = process.env.TWITTER_CLIENT_ID
const defaultClientSecret = process.env.TWITTER_CLIENT_SECRET
const defaultAccessToken = process.env.TWITTER_ACCESS_TOKEN
const defaultAccessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

const MAX_TWEETS_PAGE_SIZE = 200

exports.getClient = async ({
  logger = defaultLogger,
  clientId = defaultClientId,
  clientSecret = defaultClientSecret,
  accessToken = defaultAccessToken,
  accessTokenSecret = defaultAccessTokenSecret
}) => {
  const twitterClient = new Twitter({
    consumer_key: clientId,
    consumer_secret: clientSecret,
    access_token_key: accessToken,
    access_token_secret: accessTokenSecret
  })

  async function resolvePagedQuery(endpoint, opts) {
    const {
      maxLimit,
      onPage,
      resultsKey,
      method,
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
          method,
          params
        })
      } catch (err) {
        logger.warn(
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

      logger.info(
        'twitter',
        endpoint,
        `page=${page} size=${pageResults.length} total=${results.length}`
      )

      if (resultsKey && (!cursor || cursor === '0')) {
        break
      }

      if (onPage) {
        await onPage({
          results: pageResults,
          cursor,
          maxId
        })
      }

      if (maxLimit && results.length >= maxLimit) {
        break
      }

      // testing
      // return {
      //   cursor,
      //   maxId,
      //   err: {
      //     code: 88,
      //     message: 'test'
      //   },
      //   results
      // }

      ++page
    } while (true)

    return {
      results
    }
  }

  async function resolveTwitterQuery(opts) {
    const { method = 'get', endpoint, params } = opts

    logger.debug('twitter', endpoint, params)
    let rateLimitReset
    let code

    try {
      return await pRetry(
        async () => {
          try {
            const res = await twitterClient[method](endpoint, params)
            return res
          } catch (err) {
            const error = err.errors && err.errors[0]

            if (err._headers) {
              const reset = err._headers.get('x-rate-limit-reset')

              if (reset) {
                rateLimitReset = parseInt(reset)
              }

              if (logger.level > 4) {
                logger.verbose(
                  'twitter error',
                  JSON.stringify(
                    Object.fromEntries(err._headers.entries()),
                    null,
                    2
                  ),
                  rateLimitReset
                )
              }
            }

            if (error) {
              code = error.code
              throw new pRetry.AbortError(`${error.message} (twitter)`)
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

      if (rateLimitReset) {
        err.rateLimitReset = rateLimitReset
      }

      throw err
    }
  }

  twitterClient.resolvePagedQuery = resolvePagedQuery
  twitterClient.resolveTwitterQuery = resolveTwitterQuery

  return twitterClient
}
