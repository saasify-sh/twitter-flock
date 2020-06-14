'use strict'

const findFreePort = require('find-free-port')
const Koa = require('koa')
const open = require('open')
const url = require('url')
const qs = require('qs')
const btoa = require('btoa')

const saasify = require('./saasify')

module.exports = async (client) => {
  let _resolve
  let _reject

  const serverP = new Promise((resolve, reject) => {
    _resolve = resolve
    _reject = reject
  })

  const [port] = await findFreePort(6013)
  const app = new Koa()
  app.use(async (ctx) => {
    const { searchParams } = new url.URL(
      `${ctx.request.origin}${ctx.request.url}`
    )
    console.log('query', Object.fromEntries(searchParams.entries()))
    const code = searchParams.get('code')

    if (!code) {
      _reject(code)
      ctx.body = 'Error authenticating with Twitter. 😭'
      return
    }

    _resolve(code)
    ctx.body =
      'Authenticated with Twitter successfully. You may now close this window. 😀'
  })

  let server
  await new Promise((resolve, reject) => {
    server = app.listen(port, (err) => {
      if (err) return reject(err)
      else return resolve()
    })
  })

  const stateRaw = JSON.stringify({
    uri: `http://localhost:${port}/auth/twitter`
  })
  const state = btoa(stateRaw)
  const params = { state }

  const opts = qs.stringify(params)
  const redirectUri = `https://auth.saasify.sh?${opts}`

  const { url: authUrl } = await saasify.getTwitterAuthUrl({ redirectUri })
  console.log({ redirectUri, authUrl })

  // eslint-disable-next-line
  open(authUrl)
  const code = await serverP

  await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err)
      else return resolve()
    })
  })

  return client.authWithTwitter({
    code
  })
}
