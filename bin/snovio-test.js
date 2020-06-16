#!/usr/bin/env node
'use strict'

require('dotenv-safe').config()

const fs = require('fs')
const pMap = require('p-map')

const SnovIO = require('../lib/snovio')

async function main() {
  const snovio = new SnovIO()
  await snovio.auth()

  const users = JSON.parse(
    fs.readFileSync('./fixtures/twitter-users-small.json')
  )

  const output = await pMap(
    users,
    async (user) => {
      try {
        const url = `https://twitter.com/${user.screen_name}`

        const res = await snovio.request('v1/add-url-for-search', {
          method: 'post',
          json: {
            url
          }
        })

        console.log(res.body)
        return res.body
      } catch (err) {
        console.error('error', user.screen_name, err)
      }
    },
    {
      concurrency: 4
    }
  )

  console.log(JSON.stringify(output, null, 2))
}

main().catch((err) => {
  console.error(err)
})
