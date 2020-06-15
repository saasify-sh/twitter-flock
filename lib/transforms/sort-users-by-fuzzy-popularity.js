'use strict'

module.exports = function sortUsersByFuzzyPopularity(users) {
  const temp = users.map((user, index) => ({
    index,
    score: getScoreForUser(user)
  }))

  // sort by score in descending order so we process the most popular users first
  temp.sort((a, b) => b.score - a.score)

  return temp.map((temp) => users[temp.index])
}

function getScoreForUser(user) {
  const numFollowers = user.followers_count
  const numLikes = user.favourites_count
  const isVerified = user.verified

  // super basic formula ftw
  const multiplier = isVerified ? 10 : 1
  const score = (multiplier * numFollowers + numLikes / 10000) | 0

  return score
}
