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
