'use strict'

module.exports = function stableDedupe(array) {
  const temp = new Set()
  const output = []

  for (const element of array) {
    if (!temp.has(element)) {
      output.push(element)
      temp.add(element)
    }
  }

  return output
}
