# Twitter Flock

> Simple & robust workflow automations for Twitter.

[![NPM](https://img.shields.io/npm/v/twitter-flock.svg)](https://www.npmjs.com/package/twitter-flock) [![Build Status](https://travis-ci.com/saasify-sh/twitter-flock.svg?branch=master)](https://travis-ci.com/saasify-sh/twitter-flock) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**TODO**: pretty demo

## How it works

All automations are built around Twitter OAuth which gives us higher rate limits and access to private actions on behalf of the authenticated user (like tweeting and sending DMs).

### BatchJob

The core functionality is built around the [BatchJob](./lib/batch-job.js) class.

`BatchJob` ensures that potentially large batches of Twitter API calls are **serializable** and **resumable**.

Each `BatchJob` instance stores all of the state it would need to continue resolving its async batched operation in the event of an error like hitting a rate limit. `BatchJob` instances are serializable in order to support exporting them to persistent storage (like a database or JSON file on disk).

### Workflow

Sequences of `BatchJob` instances can be connected together to form a [Workflow](./lib/workflow.js).

Here's an example workflow:

```js
const job = new Workflow({
  params: {
    //  user oauth credentials
    accessToken: twitterAccessToken,
    accessTokenSecret: twitterAccessTokenSecret,
    pipeline: [
      {
        type: 'twitter:get-followers',
        label: 'followers',
        params: {
          // only fetches your first 10 followers for testing purposes
          maxLimit: 10,
          count: 10
        }
      },
      {
        type: 'twitter:lookup-users',
        label: 'users',
        connect: {
          // connect the output of the first job to the `userIds` param for this job
          userIds: 'followers'
        },
        transforms: ['sort-users-by-fuzzy-popularity']
      },
      {
        type: 'twitter:send-direct-messages',
        connect: {
          // connect the output of the second job to the `users` param for this job
          users: 'users'
        },
        params: {
          // handlebars template with access to the current twitter user object
          template: `Hey @{{user.screen_name}}, I'm testing an open source Twitter automation tool and you happen to be my one and only lucky test user.\n\nSorry for the spam. https://github.com/saasify-sh/twitter-flock`
        }
      }
    ]
  }
})

await job.run()
```

This workflow is comprised of three jobs:

- `twitter:get-followers` - Fetches the user ids of all of your followers.
  - Batches twitter API calls to [twitter followers/ids](https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-followers-ids)
- `twitter:lookup-users` - Expands these user ids into user objects.
  - Batches twitter API calls to [users/lookup](https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-users-lookup)
- `twitter:send-direct-messages` - Sends a template-based direct message to each of these users.
  - Batches twitter API calls to [direct_messages/events/new](https://developer.twitter.com/en/docs/direct-messages/sending-and-receiving/api-reference/new-event)

## Future work

A more robust, scalable version of this project should use something along the lines of [Apache Kafka](https://kafka.apache.org), potentially using [kafka.js](https://kafka.js.org).

Kafka would add quite a bit of complexity, but it would also handle a lot of details and be significantly more efficient. In particular, Kafa would solve the producer / consumer model, give us much more robust error handling, horizontal scalability, storing and committing state, and enable easy interop with many different data sources and sinks.

This project was meant as a quick prototype, however, and our relatively simple `BatchJob` abstraction works pretty well all things considered.

### Producer / Consumer

One of the disadvantages of the current design is that a `BatchJob` needs to complete before any dependent jobs can run, whereas we'd really like to model this as a [Producer-Consumer problem](https://en.wikipedia.org/wiki/Producer%E2%80%93consumer_problem).

### DAG

Another shortcoming of the current design is that `Workflows` can only combine sequences of jobs where the output of one job feeds into the input of the next job.

A more extensible design would allow for workflows comprised of [directed acyclic graphs](https://en.wikipedia.org/wiki/Directed_acyclic_graph).

## License

MIT © [Saasify](https://saasify.sh)
