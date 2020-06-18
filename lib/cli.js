#!/usr/bin/env node
'use strict'

require('dotenv').config()

const fs = require('fs')
const didYouMean = require('didyoumean')
const updateNotifier = require('update-notifier')
const program = require('commander')

const pkg = require('../package')
const auth = require('./auth')
const db = require('./db')
const commands = require('./commands')
const logger = require('./logger')
const twitter = require('./twitter')
const writeFormattedOutput = require('./write-formatted-output')

function suggestCommands(cmd) {
  const availableCommands = program.commands.map((cmd) => cmd._name)
  const suggestion = didYouMean(cmd, availableCommands)
  if (suggestion) {
    logger.error(`\nDid you mean ${suggestion}?`)
  }
}

module.exports = async (argv) => {
  updateNotifier({ pkg }).notify()

  // if all four env vars exist, use them
  // otherwise, default to auth config
  // 'authorize' command should follow `t` along with prompts

  // TODO: support multiple twitter accounts

  const twitterClient = await twitter.getClient()

  // TODO: initialize twitter client here
  const context = {
    auth,
    db,
    logger,
    twitterClient
  }

  program
    .name('flock')
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', 'Enable verbose debug logs', false)
    .option(
      '-o, --output <file>',
      'Write output to the given file (defaults to stdout)'
    )
    .option('-P, --no-pretty-print', 'Disables pretty printing JSON output')
    .option('-C, --no-clipboard', 'Disables copying to system clipboard')

  for (const command of commands) {
    await Promise.resolve(command(program, context))
  }

  program.command('*', null, { noHelp: true }).action((cmd) => {
    logger.error(`Invalid command: "${cmd}"`)
    logger.error()
    program.outputHelp()
    suggestCommands(cmd)
    process.exit(1)
  })

  context.requireAuthentication = () => {
    if (!auth.isAuthenticated()) {
      logger.error('Command requires authentication. Please login first.')
      process.exit(1)
    }
  }

  context.writeOutput = async (object) => {
    return writeFormattedOutput(object, {
      file: program.output,
      pretty: program.pretty
    })
  }

  program.parse(argv)

  if (program.debug) {
    logger.level = 4
  }
}

if (!module.parent) {
  module.exports(process.argv).catch((err) => {
    logger.error(err)
    process.exit(1)
  })
}
