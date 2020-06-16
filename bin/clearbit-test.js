#!/usr/bin/env node
'use strict'

require('dotenv-safe').config()

const fs = require('fs')
const pMap = require('p-map')

const clearbit = require('../lib/clearbit')

async function main() {
  const input = JSON.parse(fs.readFileSync('./fixtures/domains.json'))

  const output = await pMap(
    input,
    async (input, index) => {
      let domain
      let results = []

      try {
        const url = new URL(input)
        domain = url.hostname

        const res = await clearbit.getProspectorSearch({
          domain,
          page_size: 20
        })
        results = res.results
      } catch (err) {
        console.error('error', domain, err)
      }

      const res = {
        index,
        input,
        domain,
        results
      }

      console.log(JSON.stringify(res, null, 2))
      return res
    },
    {
      concurrency: 1
    }
  )

  console.log(JSON.stringify(output, null, 2))
  fs.writeFileSync('out.json', JSON.stringify(output, null, 2))
}

main().catch((err) => {
  console.error(err)
})
