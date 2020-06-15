# Twitter Flock

> Utilities for automating Twitter workflows that work on any sized account.

[![NPM](https://img.shields.io/npm/v/twitter-flock.svg)](https://www.npmjs.com/package/twitter-flock) [![Build Status](https://travis-ci.com/saasify-sh/twitter-flock.svg?branch=master)](https://travis-ci.com/saasify-sh/twitter-flock) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

**TODO**: pretty demo

## How it works

All utilities are built around Twitter OAuth which gives us higher rate limits and access to private actions on behalf of the authenticated user (like tweeting or sending DMs).

The core functionality is built around the [BatchJob](./lib/batch-job.js) class which implements the basic components needed to run large batch jobs that will be robust against various types of errors including rate limiting and network connectivity issues.

In particular, `BatchJob` ensures that potentially large batches of calls to specific Twitter API endpoints are **serializable** and **resumable**.

Each `BatchJob` stores all state it needs to continue resolving an async batched operation in the event of any type of failure, and this state can be serialized and exported to a database.

One of the disadvantages of the current design is that a `BatchJob` needs to complete before any dependent jobs can run, whereas we'd really like to model this as a [Producer-Consumer problem](https://en.wikipedia.org/wiki/Producer%E2%80%93consumer_problem).

## Future work

A more robust, scalable version of this project should use something along the lines of [Apache Kafka](https://kafka.apache.org) likely using [kafka.js](https://kafka.js.org).

Kafka would add quite a bit of complexity, but it would also handle quite a few details and be significantly more efficient. In particular, Kafa would solve the producer / consumer model, give us much more robust error modeling, handle storing and commiting state, and enable easy interop with many data sources and sinks.

This project was meant to be a quick prototype, however, and our relatively simple `BatchJob` abstraction works pretty well all things considered.

## License

MIT © [Saasify](https://saasify.sh)
