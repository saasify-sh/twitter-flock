'use strict'

const extractEmails = require('./extract-emails')
const extractEmailsFuzzy = require('./extract-emails-fuzzy')
const isValidEmail = require('./is-valid-email')
const stableDedupe = require('./stable-dedupe')

module.exports = function findEmailForTwitterUser(user) {
  const { name, description, entities } = user
  const relatedUrls = []
  let emails = []

  for (const entity of Object.keys(entities)) {
    const { urls = [] } = entities[entity]

    for (const urlInfo of urls) {
      const { expanded_url: expandedUrl } = urlInfo

      if (expandedUrl) {
        try {
          relatedUrls.push(new URL(expandedUrl))
        } catch (err) {
          console.error('invalid url', expandedUrl)
        }
      }
    }
  }

  if (isValidEmail(name)) {
    emails.push(name)
  }

  emails = emails.concat(extractEmails(description))
  emails = emails.concat(extractEmailsFuzzy(description))
  emails = stableDedupe(emails)

  // if (!emails.length) {
  //   for (const url of relatedUrls) {

  //   }
  // }

  return emails
}
