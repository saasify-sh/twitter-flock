#!/usr/bin/env node
'use strict'

require('dotenv-safe').config()

// const BatchJobFactory = require('./lib/batch-job-factory')
const Workflow = require('./lib/workflow')
const db = require('./lib/db')

const twitterAccessToken = process.env.TWITTER_USER_ACCESS_TOKEN
const twitterAccessTokenSecret = process.env.TWITTER_USER_ACCESS_TOKEN_SECRET

async function main() {
  const job = new Workflow(
    {
      params: {
        accessToken: twitterAccessToken,
        accessTokenSecret: twitterAccessTokenSecret,
        pipeline: [
          {
            type: 'twitter:get-followers',
            label: 'followers',
            params: {
              maxLimit: 10,
              count: 1
            }
          },
          {
            type: 'twitter:lookup-users',
            label: 'users',
            connect: {
              userIds: 'followers'
            },
            transforms: ['sort-users-by-fuzzy-popularity']
          }
          // {
          //   type: 'twitter:send-direct-messages',
          //   connect: {
          //     users: 'users'
          //   },
          //   params: {
          //     template: `Hey @{{user.screen_name}}, I'm testing an open source Twitter automation tool and you happen to be my lucky test user.\n\nSorry for the spam. https://github.com/saasify-sh/twitter-flock`
          //   }
          // }
        ]
      }
    },
    {
      db
    }
  )

  // const job = BatchJobFactory.createBatchJobTwitterGetFollowers({
  //   params: {
  //     accessToken: twitterAccessToken,
  //     accessTokenSecret: twitterAccessTokenSecret,
  //     maxLimit: 10,
  //     count: 10
  //   }
  // })

  // const job = BatchJobFactory.createBatchJobTwitterLookupUsers({
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

  // const job = BatchJobFactory.createBatchJobTwitterSendDirectMessages({
  //   params: {
  //     accessToken: twitterAccessToken,
  //     accessTokenSecret: twitterAccessTokenSecret,
  //     users: [user],
  //     template: `Hey @{{user.screen_name}},

  //     Thanks for following me ☺ Check out https://github.com/saasify-sh/saasify`
  //   }
  // })

  await job.run()
  console.log(JSON.stringify(job.serialize(), null, 2))
}

main().catch((err) => {
  console.error(err)
})
