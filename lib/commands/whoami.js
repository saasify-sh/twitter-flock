'use strict'

const handleError = require('../handle-error')

module.exports = (program, context) => {
  program
    .command('whoami')
    .description('Prints information about the current user')
    .action(async (arg, opts) => {
      // if (!context.requireAuthentication()) {
      //   return
      // }

      try {
        const user = await context.twitterClient.resolveTwitterQuery({
          endpoint: 'account/verify_credentials'
        })

        await context.writeOutput(user)
      } catch (err) {
        handleError(program, err)
      }
    })
}
