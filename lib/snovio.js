'use strict'

const got = require('got')
const pThrottle = require('p-throttle')

const defaultBaseUrl = 'https://api.snov.io'

class SnovIO {
  constructor(opts = {}) {
    this._clientId = opts.clientId || process.env.SNOV_IO_API_CLIENT_ID
    this._clientSecret =
      opts.clientSecret || process.env.SNOV_IO_API_CLIENT_SECRET
    this._baseUrl = opts.baseUrl || defaultBaseUrl

    if (!this._clientId) {
      throw new Error('SnovIO invalid clientId')
    }

    if (!this._clientSecret) {
      throw new Error('SnovIO invalid clientSecret')
    }

    this._accessToken = null

    // throttle API calls to max one per second
    this.request = pThrottle(this._request.bind(this), 1, 1000)
  }

  async auth() {
    const res = await this.request('v1/oauth/access_token', {
      method: 'POST',
      json: {
        grant_type: 'client_credentials',
        client_id: this._clientId,
        client_secret: this._clientSecret
      }
    })

    this._accessToken = res.body.access_token
  }

  async _request(url, opts) {
    const headers = { ...opts.headers }

    if (this._accessToken) {
      headers.Authorization = `Bearer ${this._accessToken}`
    }

    return got(url, {
      prefixUrl: this._baseUrl,
      responseType: 'json',
      ...opts,
      headers
    })
  }
}

module.exports = SnovIO
