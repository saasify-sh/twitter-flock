'use strict'

const extractEmails = require('./extract-emails')
const extractEmailsFuzzy = require('./extract-emails-fuzzy')
const isValidEmail = require('./is-valid-email')
const stableDedupe = require('./stable-dedupe')
const stableDedupeUrls = require('./stable-dedupe-urls')

// 25% of sampled profiles have at least one URL associated with them (either in their description or site)
// 22% of those sampled profiles were able to extract an email from their URL (6% overall)

module.exports = function findEmailForTwitterUser(user) {
  const { name, description, entities, status } = user
  let linkedUrls = []
  let emails = []

  for (const entity of Object.keys(entities)) {
    const { urls = [] } = entities[entity]

    for (const urlInfo of urls) {
      const { expanded_url: expandedUrl } = urlInfo

      if (expandedUrl) {
        try {
          linkedUrls.push(new URL(expandedUrl).toString())
        } catch (err) {
          // ignore invalid urls
        }
      }
    }
  }

  linkedUrls = stableDedupeUrls(linkedUrls)

  if (isValidEmail(name)) {
    emails.push(name)
  }

  emails = emails.concat(extractEmails(description))
  emails = emails.concat(extractEmailsFuzzy(description))

  if (status) {
    const { text } = status

    emails = emails.concat(extractEmails(text))
    emails = emails.concat(extractEmailsFuzzy(text))
  }

  emails = stableDedupe(emails)

  if (!emails.length) {
    // console.log(
    //   user.screen_name,
    //   linkedUrls.map((url) => url.toString())
    // )
  }

  return emails
}
