#!/usr/bin/env node
'use strict'

require('dotenv-safe').config()

const twitter = require('./lib/twitter')
const spinner = require('./lib/spinner')

const twitterAccessToken = process.env.TWITTER_USER_ACCESS_TOKEN
const twitterAccessTokenSecret = process.env.TWITTER_USER_ACCESS_TOKEN_SECRET

async function main() {
  const twitterClient = await spinner(
    twitter.getClient({
      accessToken: twitterAccessToken,
      accessTokenSecret: twitterAccessTokenSecret
    }),
    'Initializing twitter'
  )

  const res = await twitterClient.resolvePagedQuery('followers/ids', {
    resultsKey: 'ids',
    maxLimit: 10,
    twitterOptions: {
      stringify_ids: true,
      count: 1
    }
  })

  const followers = res.results

  console.log('followers', JSON.stringify(followers, null, 2))
}

main().catch((err) => {
  console.error(err)
})
