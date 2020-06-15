#!/usr/bin/env node
'use strict'

require('dotenv-safe').config()

// const dedent = require('dedent')
// const twitter = require('./lib/twitter')
// const spinner = require('./lib/spinner')
const BatchJobFactory = require('./lib/batch-job-factory')

const twitterAccessToken = process.env.TWITTER_USER_ACCESS_TOKEN
const twitterAccessTokenSecret = process.env.TWITTER_USER_ACCESS_TOKEN_SECRET

async function main() {
  const workflow = BatchJobFactory.createWorkflow({
    type: 'workflow:twitter:message-followers',
    params: {
      accessToken: twitterAccessToken,
      accessTokenSecret: twitterAccessTokenSecret,
      pipeline: [
        {
          type: 'twitter:get-followers',
          label: 'followers',
          params: {
            maxLimit: 1,
            count: 1
          }
        },
        {
          type: 'twitter:lookup-users',
          label: 'users',
          connect: {
            userIds: 'followers'
          }
        },
        {
          type: 'twitter:send-direct-messages',
          connect: {
            users: 'users'
          }
        }
      ]
    }
  })

  // const batchJob = BatchJobFactory.createBatchJobTwitterGetFollowers({
  //   params: {
  //     accessToken: twitterAccessToken,
  //     accessTokenSecret: twitterAccessTokenSecret,
  //     maxLimit: 10,
  //     count: 10
  //   }
  // })

  // const batchJob = BatchJobFactory.createBatchJobTwitterLookupUsers({
  //   params: {
  //     accessToken: twitterAccessToken,
  //     accessTokenSecret: twitterAccessTokenSecret,
  //     batchSize: 2,
  //     userIds: [
  //       '895851994346401792',
  //       '1236214051576766469',
  //       '948428628957843456',
  //       '1256076780642934785',
  //       '477975810',
  //       '102739305',
  //       '1263940243616600065',
  //       '327034465'
  //     ]
  //   }
  // })

  // const batchJob = BatchJobFactory.createBatchJobTwitterSendDirectMessages({
  //   params: {
  //     accessToken: twitterAccessToken,
  //     accessTokenSecret: twitterAccessTokenSecret,
  //     users: [user],
  //     template: dedent`Hey @{{user.screen_name}},

  //     Thanks for following me ☺ Check out https://github.com/saasify-sh/saasify`
  //   }
  // })

  await batchJob.run()
  console.log(JSON.stringify(JSON.parse(batchJob.seralize()), null, 2))

  // const twitterClient = await spinner(
  //   twitter.getClient({
  //     accessToken: twitterAccessToken,
  //     accessTokenSecret: twitterAccessTokenSecret
  //   }),
  //   'Initializing twitter'
  // )

  // const res = await twitterClient.resolvePagedQuery('followers/ids', {
  //   resultsKey: 'ids',
  //   maxLimit: 10,
  //   twitterOptions: {
  //     stringify_ids: true,
  //     count: 1
  //   }
  // })

  // const followers = res.results
  // console.log('followers', JSON.stringify(followers, null, 2))
}

main().catch((err) => {
  console.error(err)
})
