#!/usr/bin/env node
'use strict'

require('dotenv-safe').config()

const dedent = require('dedent')
// const twitter = require('./lib/twitter')
// const spinner = require('./lib/spinner')
const BatchJobFactory = require('./lib/batch-job-factory')

const twitterAccessToken = process.env.TWITTER_USER_ACCESS_TOKEN
const twitterAccessTokenSecret = process.env.TWITTER_USER_ACCESS_TOKEN_SECRET

async function main() {
  // const batchJob = BatchJobFactory.createBatchJobTwitterGetFollowers({
  //   params: {
  //     accessToken: twitterAccessToken,
  //     accessTokenSecret: twitterAccessTokenSecret,
  //     maxLimit: 10,
  //     count: 1
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

  const user = {
    id: 327034465,
    id_str: '327034465',
    name: 'Travis Fischer',
    screen_name: 'transitive_bs',
    location: 'Brooklyn, NY',
    description:
      'Founder passionately working on https://t.co/luX0GkWDNQ 💪\n\nFacebook / Microsoft / two startup exits. I love JS, TS, react, serverless, opengl, SaaS, anime, and cats 😸',
    url: 'https://t.co/3GeYdk9EDF',
    entities: {
      url: {
        urls: [
          {
            url: 'https://t.co/3GeYdk9EDF',
            expanded_url: 'https://saasify.sh',
            display_url: 'saasify.sh',
            indices: [0, 23]
          }
        ]
      },
      description: {
        urls: [
          {
            url: 'https://t.co/luX0GkWDNQ',
            expanded_url: 'http://saasify.sh',
            display_url: 'saasify.sh',
            indices: [32, 55]
          }
        ]
      }
    },
    protected: false,
    followers_count: 683,
    friends_count: 350,
    listed_count: 32,
    created_at: 'Thu Jun 30 22:01:58 +0000 2011',
    favourites_count: 12601,
    utc_offset: null,
    time_zone: null,
    geo_enabled: true,
    verified: false,
    statuses_count: 2420,
    lang: null,
    status: {
      created_at: 'Sun Jun 14 21:47:15 +0000 2020',
      id: 1272284491617271800,
      id_str: '1272284491617271813',
      text:
        "@vasa_develop @scottsilvi @balajis @saasify_sh Loved seeing your submission btw 👏\n\nLemme know if you're interested… https://t.co/Wb1kI4v4YA",
      truncated: true,
      entities: {
        hashtags: [],
        symbols: [],
        user_mentions: [
          {
            screen_name: 'vasa_develop',
            name: 'vasa',
            id: 893875627916378100,
            id_str: '893875627916378112',
            indices: [0, 13]
          },
          {
            screen_name: 'scottsilvi',
            name: 'Be More Curious',
            id: 96048399,
            id_str: '96048399',
            indices: [14, 25]
          },
          {
            screen_name: 'balajis',
            name: 'Balaji S. Srinivasan',
            id: 2178012643,
            id_str: '2178012643',
            indices: [26, 34]
          },
          {
            screen_name: 'saasify_sh',
            name: 'Saasify',
            id: 1171898954818216000,
            id_str: '1171898954818215936',
            indices: [35, 46]
          }
        ],
        urls: [
          {
            url: 'https://t.co/Wb1kI4v4YA',
            expanded_url:
              'https://twitter.com/i/web/status/1272284491617271813',
            display_url: 'twitter.com/i/web/status/1…',
            indices: [116, 139]
          }
        ]
      },
      source:
        '<a href="https://mobile.twitter.com" rel="nofollow">Twitter Web App</a>',
      in_reply_to_status_id: 1272280034330292200,
      in_reply_to_status_id_str: '1272280034330292224',
      in_reply_to_user_id: 893875627916378100,
      in_reply_to_user_id_str: '893875627916378112',
      in_reply_to_screen_name: 'vasa_develop',
      geo: null,
      coordinates: null,
      place: null,
      contributors: null,
      is_quote_status: false,
      retweet_count: 0,
      favorite_count: 1,
      favorited: false,
      retweeted: false,
      lang: 'en'
    },
    contributors_enabled: false,
    is_translator: false,
    is_translation_enabled: false,
    profile_background_color: '569FD2',
    profile_background_image_url:
      'http://abs.twimg.com/images/themes/theme6/bg.gif',
    profile_background_image_url_https:
      'https://abs.twimg.com/images/themes/theme6/bg.gif',
    profile_background_tile: true,
    profile_image_url:
      'http://pbs.twimg.com/profile_images/1236637281072578561/S2POoE76_normal.jpg',
    profile_image_url_https:
      'https://pbs.twimg.com/profile_images/1236637281072578561/S2POoE76_normal.jpg',
    profile_banner_url:
      'https://pbs.twimg.com/profile_banners/327034465/1502552927',
    profile_link_color: '91D2FA',
    profile_sidebar_border_color: 'F1F2E8',
    profile_sidebar_fill_color: 'F1F2E8',
    profile_text_color: '3E3E3E',
    profile_use_background_image: true,
    has_extended_profile: true,
    default_profile: false,
    default_profile_image: false,
    following: true,
    follow_request_sent: false,
    notifications: false,
    translator_type: 'none'
  }

  const batchJob = BatchJobFactory.createBatchJobTwitterSendDirectMessages({
    params: {
      accessToken: twitterAccessToken,
      accessTokenSecret: twitterAccessTokenSecret,
      users: [user],
      template: dedent`Hey @{{user.screen_name}},

      Thanks for following me ☺ Check out https://github.com/saasify-sh/saasify`
    }
  })

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
