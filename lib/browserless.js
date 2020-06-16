'use strict'

const got = require('got')

const defaultBaseUrl = 'https://chrome.browserless.io'

class Browserless {
  constructor(opts = {}) {
    this._token = opts.token || process.env.BROWSERLESS_TOKEN

    if (!this._token) {
      throw new Error('Browserless invalid token')
    }

    this._baseUrl = opts.baseUrl || defaultBaseUrl
  }

  async request(url, opts) {
    const searchParams = { token: this._token, ...opts.searchParams }

    return got(url, {
      prefixUrl: this._baseUrl,
      responseType: 'json',
      ...opts,
      searchParams
    })
  }
}

module.exports = Browserless
