'use strict'

module.exports = function stableDedupeUrls(array) {
  const temp = new Set()
  const output = []

  for (const uri of array) {
    try {
      const url = new URL(uri)
      if (!temp.has(uri) && !temp.has(url.host)) {
        output.push(uri)
        temp.add(uri)
        temp.add(url.host)
      }
    } catch (err) {
      // ignore invalid urls
    }
  }

  return output
}
