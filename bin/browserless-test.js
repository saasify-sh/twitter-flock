#!/usr/bin/env node
'use strict'

require('dotenv-safe').config()

const fs = require('fs')
const pMap = require('p-map')

const Browserless = require('../lib/browserless')
const extractEmailsFromUrl = require('../lib/extract-emails-from-url')
const stableDedupe = require('../lib/stable-dedupe')

async function main() {
  const browserless = new Browserless()

  // all of these sites include links with "mailto:" emails
  // const urls = [
  //   'https://transitivebullsh.it',
  //   'http://www.dogthecynic.com',
  //   'https://www.nickbytes.com/',
  //   'http://www.wonderloop.com',
  //   'http://smallround.co'
  // ]

  const users = JSON.parse(
    fs.readFileSync('./fixtures/twitter-users-10k-urls.json')
  ).slice(0, 100)

  const output = await pMap(
    users,
    async (user) => {
      try {
        let emails = []
        for (const url of user.urls) {
          const emailsForUrl = await extractEmailsFromUrl(url, { browserless })
          emails = emails.concat(emailsForUrl)
        }

        emails = stableDedupe(emails)
        user = {
          ...user,
          emails
        }
        console.log(user)
        return user
      } catch (err) {
        console.error('error', user, err)
      }
    },
    {
      concurrency: 8
    }
  )

  console.log(JSON.stringify(output, null, 2))
}

main().catch((err) => {
  console.error(err)
})
