'use strict'

const stableDedupe = require('./stable-dedupe')

module.exports = async function extractEmailsFromUrl(url, opts) {
  const { browserless } = opts

  const res = await browserless.request('scrape', {
    method: 'post',
    json: {
      url,
      elements: [
        {
          selector: 'a'
        }
      ],
      rejectRequestPattern: ['png', 'jpg', 'jpeg', 'webm', 'mp4', 'mov']
    }
  })

  const { results } = res.body.data[0]
  const emails = results
    .map((results) => {
      const href = results.attributes.find((attr) => attr.name === 'href')
      if (href) {
        if (href.value && href.value.startsWith('mailto:')) {
          return href.value.slice(7).trim()
        }
      }
    })
    .filter(Boolean)

  return stableDedupe(emails)
}
