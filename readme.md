# Twitter Flock

> Simple & robust workflows to export your flock of followers from Twitter.

<p align="center">
  <a href="https://saasify.sh" title="Saasify">
    <img src="https://raw.githubusercontent.com/saasify-sh/twitter-flock/master/media/twitter.jpg" alt="Twitter Flock" />
  </a>
</p>

[![Build Status](https://travis-ci.com/saasify-sh/twitter-flock.svg?branch=master)](https://travis-ci.com/saasify-sh/twitter-flock) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## How it works

All automations are built around Twitter OAuth which gives us higher rate limits and access to private user actions like tweeting and sending DMs.

### BatchJob

The core automation functionality is built around the [BatchJob](./lib/batch-job.js) class.

The goal of `BatchJob` is to ensure that potentially large batches of Twitter API calls are **serializable** and **resumable**.

A `BatchJob` stores all of the state it would need to continue resolving its async batched operation in the event of an error. `BatchJob` instances support serializing their state in order to store them in a database of JSON file on disk.

Here's an example batch job in action:

```js
// fetches the user ids for all of your followers
const job = BatchJobFactory.createBatchJobTwitterGetFollowers({
  params: {
    // assumes that you already have user oauth credentials
    accessToken: twitterAccessToken,
    accessTokenSecret: twitterAccessTokenSecret,

    // only fetch your first 10 followers for testing purposes
    maxLimit: 10,
    count: 10
  }
})

// process as much of this job as possible until it either completes or errors
await job.run()

// job.status: 'active' | 'done' | 'error'
// job.results: string[]
console.log(job.status, job.results)

// store this job to disk
fs.writeFileSync('out.json', job.serialize())

// ...

// read the job from disk and resume processing
const jobData = fs.readFileSync('out.json')
const job = BatchJobFactory.deserialize(jobData)

if (job.status === 'active') {
  await job.run()
}
```

This example also shows how to serialize and resume a job.

### Workflow

Sequences of `BatchJob` instances can be connected together to form a [Workflow](./lib/workflow.js).

Here's an example workflow:

```js
const job = new Workflow({
  params: {
    // assumes that you already have user oauth credentials
    accessToken: twitterAccessToken,
    accessTokenSecret: twitterAccessTokenSecret,
    pipeline: [
      {
        type: 'twitter:get-followers',
        label: 'followers',
        params: {
          // only fetch your first 10 followers for testing purposes
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

Note that `Workflow` derives from `BatchJob`, so workflows are also serializable and resumable. Huzzah!

## Future work

A more robust, scalable version of this project would use a solution like [Apache Kafka](https://kafka.apache.org). [Kafka.js](https://kafka.js.org) looks useful as a higher-level Node.js wrapper.

Kafka would add quite a bit of complexity, but it would also handle a lot of details and be significantly more efficient. In particular, Kafka would solve the producer / consumer model, give us more robust error handling, horizontal scalability, storing and committing state, and enable easy interop with different data sources and sinks.

This project was meant as a quick prototype, however, and our relatively simple `BatchJob` abstraction works pretty well all things considered.

### Producer / Consumer

One of the disadvantages of the current design is that a `BatchJob` needs to complete before any dependent jobs can run, whereas we'd really like to model this as a [Producer-Consumer problem](https://en.wikipedia.org/wiki/Producer%E2%80%93consumer_problem).

### DAGs

Another shortcoming of the current design is that `Workflows` can only combine sequences of jobs where the output of one job feeds into the input of the next job.

A more extensible design would allow for workflows comprised of [directed acyclic graphs](https://en.wikipedia.org/wiki/Directed_acyclic_graph).

## MVP TODO

- [x] resumable batch jobs
- [x] resumable workflows (sequences of batch jobs)
- [x] twitter:get-followers batch job
- [x] twitter:lookup-users batch job
- [x] twitter:send-direct-messages batch job
- [x] test workflow which combines these three batch jobs
- [x] test rate limits
  - twitter:get-followers 75k / 15 min
  - twitter:lookup-users 90k / 15 min
  - twitter:send-direct-messages 1k / day
  - twitter:send-tweets 300 / 3h -> 2.4k / day
- [x] large account test
- [x] gracefully handle twitter rate limits
- [x] experiment with extracting public emails
- [x] add default persistent storage
  - via [leveldb](https://github.com/Level/level)
- [x] support commiting batch job updates
- [x] user-friendly cli
- [x] add cli support for different output formats
  - via [sheetjs/xlsx](https://github.com/SheetJS/sheetjs#supported-output-formats)
  - json, csv, xls, xlsx, html, txt, etc
- [x] gracefully handle process exit
- [ ] initial set of cli commands
- [ ] cli oauth support
- [ ] unit tests for snapshotting, serializing, deserializing
- [ ] unit tests for workflows
- [ ] convert transforms to batchjob
- [ ] more dynamic rate limit handling
- [ ] support bring-your-own-api-key
- [ ] basic docs and demo video
- [ ] hosted saasify version

## License

MIT © [Saasify](https://saasify.sh)

Support my OSS work by <a href="https://twitter.com/transitive_bs">following me on twitter <img src="https://storage.googleapis.com/saasify-assets/twitter-logo.svg" alt="twitter" height="24px" align="center"></a>
